import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Issue from "@/models/Issue";

// GET /api/comments - Get comments for an issue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issue");

    if (!issueId) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify issue exists and user has access
    const issue = await Issue.findById(issueId).populate("project", "team");
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const projectTeam = (issue.project as unknown as { team: string }).team;
    if (
      currentUser.role !== "admin" &&
      String(projectTeam) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await Comment.find({
      issue: issueId,
      deletedAt: null,
    })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin and members can create comments
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { body, issueId, parentId } = await request.json();

    if (!body || !issueId) {
      return NextResponse.json(
        { error: "Comment body and issue ID are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify issue exists and user has access
    const issue = await Issue.findById(issueId).populate("project", "team");
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const issueProjectTeam = (issue.project as unknown as { team: string })
      .team;
    if (
      currentUser.role !== "admin" &&
      String(issueProjectTeam) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || String(parentComment.issue) !== issueId) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 }
        );
      }
    }

    const comment = new Comment({
      body,
      issue: issueId,
      author: session.user.id,
      parent: parentId || null,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name email"
    );

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment: populatedComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
