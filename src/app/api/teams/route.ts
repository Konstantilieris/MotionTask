import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import { TeamUtils } from "@/lib/team-utils";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";

// GET /api/teams - Get all teams (admin only) or user's team
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();

    if (currentUser.role === "admin") {
      // Admin can see all teams
      const teams = await Team.find({ deletedAt: null })
        .populate("members", "name email role")
        .sort({ createdAt: -1 });
      return NextResponse.json({ teams });
    } else {
      // Regular users can only see their own team
      const team = await Team.findById(currentUser.team).populate(
        "members",
        "name email role"
      );
      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      return NextResponse.json({ teams: [team] });
    }
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const team = await TeamUtils.createTeam({
      name,
      slug,
      description,
    });

    return NextResponse.json(
      {
        message: "Team created successfully",
        team,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
