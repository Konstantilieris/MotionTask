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
    const { issueKey, column, afterKey, beforeKey } = body;

    // Support legacy issueId field for backward compatibility
    const issueIdentifier = issueKey || body.issueId;
    const afterIdentifier = afterKey || body.afterId;
    const beforeIdentifier = beforeKey || body.beforeId;

    if (!issueIdentifier || !column) {
      return NextResponse.json(
        { error: "Missing required fields: issueKey (or issueId), column" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the issue to reorder
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

    // Find the before and after issues to determine the new rank
    let beforeRank: string | null = null;
    let afterRank: string | null = null;

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

    // Calculate new rank
    const newRank = rankBetween(beforeRank, afterRank);

    // Update the issue
    await Issue.findByIdAndUpdate(issue._id, {
      status: column,
      rank: newRank,
    });

    return NextResponse.json({
      success: true,
      newRank,
      message: "Issue reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
