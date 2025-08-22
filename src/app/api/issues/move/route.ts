import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import { rankBetween } from "@/lib/utils/lexorank";
import { Types } from "mongoose";

// Helper function to resolve issue by key or ID
async function resolveIssue(keyOrId: string) {
  if (Types.ObjectId.isValid(keyOrId)) {
    return await Issue.findById(keyOrId).populate("project");
  }
  return await Issue.findOne({ key: keyOrId, deletedAt: null }).populate(
    "project"
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { issueKey, toColumn, position } = body;

    // Support legacy issueId field for backward compatibility
    const issueIdentifier = issueKey || body.issueId;

    if (!issueIdentifier || !toColumn) {
      return NextResponse.json(
        { error: "Missing required fields: issueKey (or issueId), toColumn" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the issue to move
    const issue = await resolveIssue(issueIdentifier);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get current user to check team access
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the project and check access
    const project = await Project.findById(issue.project);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project via team membership
    if (
      currentUser.role !== "admin" &&
      String(project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate new rank based on position
    let newRank: string;

    if (
      position?.afterKey ||
      position?.beforeKey ||
      position?.afterId ||
      position?.beforeId
    ) {
      let beforeRank: string | null = null;
      let afterRank: string | null = null;

      const beforeIdentifier = position.beforeKey || position.beforeId;
      const afterIdentifier = position.afterKey || position.afterId;

      if (beforeIdentifier) {
        const beforeIssue = await resolveIssue(beforeIdentifier);
        if (beforeIssue) {
          beforeRank = beforeIssue.rank;
        }
      }

      if (afterIdentifier) {
        const afterIssue = await resolveIssue(afterIdentifier);
        if (afterIssue) {
          afterRank = afterIssue.rank;
        }
      }

      newRank = rankBetween(beforeRank, afterRank);
    } else {
      // No specific position, place at the end of the column
      const lastIssue = await Issue.findOne({
        project: issue.project._id,
        status: toColumn,
        deletedAt: null,
      }).sort({ rank: -1 });

      newRank = rankBetween(lastIssue?.rank || null, null);
    }

    // Update the issue
    await Issue.findByIdAndUpdate(issue._id, {
      status: toColumn,
      rank: newRank,
    });

    return NextResponse.json({
      success: true,
      newRank,
      message: "Issue moved successfully",
    });
  } catch (error) {
    console.error("Error moving issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
