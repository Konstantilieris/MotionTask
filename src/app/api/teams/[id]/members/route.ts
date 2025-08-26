import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/teams/:id/members → { add?: string[], remove?: string[] }
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id: teamId } = resolvedParams;
    const body = await request.json();
    const { add, remove } = body;

    if (!add && !remove) {
      return NextResponse.json(
        { error: "Either 'add' or 'remove' array must be provided" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Validate user IDs if provided
    if (add && Array.isArray(add) && add.length > 0) {
      // Dedupe the add array
      const uniqueAdd = [...new Set(add)];
      const users = await User.find({ _id: { $in: uniqueAdd } });
      if (users.length !== uniqueAdd.length) {
        return NextResponse.json(
          { error: "Some user IDs in 'add' array are invalid" },
          { status: 400 }
        );
      }

      // Add members using $addToSet to avoid duplicates
      await Team.findByIdAndUpdate(teamId, {
        $addToSet: { members: { $each: uniqueAdd } },
      });
    }

    if (remove && Array.isArray(remove) && remove.length > 0) {
      // Dedupe the remove array
      const uniqueRemove = [...new Set(remove)];

      // Remove members using $pull
      await Team.findByIdAndUpdate(teamId, {
        $pull: { members: { $in: uniqueRemove } },
      });
    }

    // Get updated team with populated members
    const updatedTeam = await Team.findById(teamId).populate(
      "members",
      "name email role"
    );

    return NextResponse.json({
      message: "Team members updated successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error updating team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
