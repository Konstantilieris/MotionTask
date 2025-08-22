/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/comments/[id] - Get comment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();
    const comment = await Comment.findById(id)
      .populate("author", "name email")
      .populate({
        path: "issue",
        populate: {
          path: "project",
          select: "team",
        },
      });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user has access to this comment's issue
    if (
      currentUser.role !== "admin" &&
      String((comment.issue as any).project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/comments/[id] - Update comment (author or admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { body } = await request.json();

    if (!body) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const comment = await Comment.findById(id).populate({
      path: "issue",
      populate: {
        path: "project",
        select: "team",
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user has access to this comment's issue
    if (
      currentUser.role !== "admin" &&
      String((comment.issue as any).project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only the author or admin can edit the comment
    if (
      String(comment.author) !== session.user.id &&
      currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    comment.body = body;
    await comment.save();

    const updatedComment = await Comment.findById(id).populate(
      "author",
      "name email"
    );

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment (author or admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();
    const comment = await Comment.findById(id).populate({
      path: "issue",
      populate: {
        path: "project",
        select: "team",
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user has access to this comment's issue
    if (
      currentUser.role !== "admin" &&
      String((comment.issue as any).project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only the author or admin can delete the comment
    if (
      String(comment.author) !== session.user.id &&
      currentUser.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    comment.deletedAt = new Date();
    await comment.save();

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
