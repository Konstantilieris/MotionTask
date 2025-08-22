import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { newParentKey } = body;

    await connectDB();

    // Find the issue to reparent by key
    const issue = await Issue.findOne({ key: resolvedParams.key }).populate(
      "project"
    );
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

    let newParent = null;
    const updateFields: Record<string, unknown> = {};

    if (newParentKey) {
      // Validate new parent by key
      newParent = await Issue.findOne({ key: newParentKey });
      if (!newParent) {
        return NextResponse.json(
          { error: "New parent not found" },
          { status: 404 }
        );
      }

      // Ensure new parent is not a subtask
      if (newParent.type === "subtask") {
        return NextResponse.json(
          { error: "Cannot make a subtask the parent of another issue" },
          { status: 400 }
        );
      }

      // Ensure new parent is in the same project
      if (!newParent.project.equals(issue.project._id)) {
        return NextResponse.json(
          { error: "New parent must be in the same project" },
          { status: 400 }
        );
      }

      // Prevent circular relationships - compare keys instead
      if (newParent.key === issue.key) {
        return NextResponse.json(
          { error: "Cannot make an issue its own parent" },
          { status: 400 }
        );
      }

      // Check if the new parent is currently a child of this issue
      const isCircular = await Issue.findOne({
        key: newParentKey,
        parent: issue._id,
      });

      if (isCircular) {
        return NextResponse.json(
          { error: "This would create a circular relationship" },
          { status: 400 }
        );
      }

      updateFields.parent = newParent._id;
      updateFields.type = "subtask";

      // Inherit epic from parent
      if (newParent.epic) {
        updateFields.epic = newParent.epic;
      }
    } else {
      // Remove parent (make it a top-level issue)
      updateFields.parent = null;

      // Change type from subtask to a regular issue type
      if (issue.type === "subtask") {
        updateFields.type = "task"; // Default to task
      }
    }

    // Update the issue
    await Issue.findOneAndUpdate({ key: resolvedParams.key }, updateFields);

    return NextResponse.json({
      success: true,
      message: newParentKey
        ? `Issue reparented successfully`
        : `Issue converted to top-level issue`,
      newParentKey,
      inheritedEpic: newParent?.epic?.toString(),
    });
  } catch (error) {
    console.error("Error reparenting issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
