import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/teams/:id/restore → clears deletedAt
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
    const { id } = resolvedParams;

    await connectDB();

    // Find team (including deleted ones)
    const team = await Team.findById(id, null, { skipMiddleware: true });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if team is actually deleted
    if (!team.deletedAt) {
      return NextResponse.json(
        { error: "Team is not deleted" },
        { status: 400 }
      );
    }

    // Restore team
    team.deletedAt = null;
    await team.save();

    // Populate for response
    await team.populate("members", "name email role");

    return NextResponse.json({
      message: "Team restored successfully",
      team,
    });
  } catch (error) {
    console.error("Error restoring team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
