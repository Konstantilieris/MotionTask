import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import { IssuesService } from "@/services/issues.service";
import { Types } from "mongoose";

interface RouteParams {
  params: Promise<{
    key: string;
  }>;
}

// Helper function to check if a string is a valid ObjectId
function isObjectId(str: string): boolean {
  return (
    Types.ObjectId.isValid(str) && new Types.ObjectId(str).toString() === str
  );
}

// GET /api/issues/[key] - Get issue by key or ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();

    // Try to find by ObjectId first, then by key
    let issue;
    if (isObjectId(key)) {
      issue = await Issue.findById(key)
        .populate("project", "name key team")
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("parent", "title key")
        .populate("epic", "title key");
    } else {
      issue = await Issue.findOne({ key: key, deletedAt: null })
        .populate("project", "name key team")
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("parent", "title key")
        .populate("epic", "title key");
    }

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check if user has access to this issue's project
    const projectTeam = (issue.project as unknown as { team: string }).team;
    if (
      currentUser.role !== "admin" &&
      String(projectTeam) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Error fetching issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/issues/[key] - Update issue
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

    // Only admin and members can update issues
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;
    const updateData = await request.json();

    await connectDB();

    // Find issue by key or ObjectId
    let existingIssue;
    if (isObjectId(key)) {
      existingIssue = await Issue.findById(key).populate("project", "team");
    } else {
      existingIssue = await Issue.findOne({
        key: key,
        deletedAt: null,
      }).populate("project", "team");
    }

    if (!existingIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const existingProjectTeam = (
      existingIssue.project as unknown as { team: string }
    ).team;
    if (
      currentUser.role !== "admin" &&
      String(existingProjectTeam) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if this is a status transition
    if (updateData.status && updateData.status !== existingIssue.status) {
      // Use the service for status transitions to enforce review gate
      try {
        const updatedIssue = await IssuesService.transitionIssue(
          (existingIssue._id as Types.ObjectId).toString(),
          updateData.status,
          (currentUser._id as Types.ObjectId).toString()
        );

        // Apply any other updates if there are any
        const otherUpdates = { ...updateData };
        delete otherUpdates.status;
        delete otherUpdates._id;
        delete otherUpdates.key;
        delete otherUpdates.issueNumber;
        delete otherUpdates.project;
        delete otherUpdates.reporter;
        delete otherUpdates.createdAt;
        delete otherUpdates.updatedAt;

        let finalIssue = updatedIssue;
        if (Object.keys(otherUpdates).length > 0) {
          finalIssue = await Issue.findByIdAndUpdate(
            existingIssue._id,
            otherUpdates,
            {
              new: true,
              runValidators: true,
            }
          )
            .populate("project", "name key")
            .populate("assignee", "name email")
            .populate("reporter", "name email")
            .populate("parent", "title key")
            .populate("epic", "title key");
        } else {
          // Re-populate the issue from transitionIssue
          finalIssue = await Issue.findById(updatedIssue!._id)
            .populate("project", "name key")
            .populate("assignee", "name email")
            .populate("reporter", "name email")
            .populate("parent", "title key")
            .populate("epic", "title key");
        }

        return NextResponse.json({
          message: "Issue updated successfully",
          issue: finalIssue,
        });
      } catch (transitionError) {
        // If transition fails due to review gate, return specific error
        return NextResponse.json(
          { error: (transitionError as Error).message },
          { status: 400 }
        );
      }
    } else {
      // Regular update without status change
      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.key;
      delete updateData.issueNumber;
      delete updateData.project;
      delete updateData.reporter;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const issue = await Issue.findByIdAndUpdate(
        existingIssue._id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("project", "name key")
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("parent", "title key")
        .populate("epic", "title key");

      return NextResponse.json({
        message: "Issue updated successfully",
        issue,
      });
    }
  } catch (error) {
    console.error("Error updating issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/issues/[key] - Partial update issue
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

// DELETE /api/issues/[id] - Delete issue (admin and members only)
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

    // Only admin and members can delete issues
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;

    await connectDB();

    // Find issue by key or ObjectId
    let issue;
    if (isObjectId(key)) {
      issue = await Issue.findById(key).populate("project", "team");
    } else {
      issue = await Issue.findOne({ key: key, deletedAt: null }).populate(
        "project",
        "team"
      );
    }

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check if user has access to this issue's project
    const deleteProjectTeam = (issue.project as unknown as { team: string })
      .team;
    if (
      currentUser.role !== "admin" &&
      String(deleteProjectTeam) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    issue.deletedAt = new Date();
    await issue.save();

    return NextResponse.json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
