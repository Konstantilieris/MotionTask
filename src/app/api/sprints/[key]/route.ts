import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Sprint from "@/models/Sprint";
import Issue from "@/models/Issue";
import { AuthUtils } from "@/lib/auth-utils";
import { Types } from "mongoose";

function isObjectId(str: string): boolean {
  return Types.ObjectId.isValid(str) && str.length === 24;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find sprint by either ObjectId or name/key
    let sprint;
    if (isObjectId(key)) {
      sprint = await Sprint.findById(key);
    } else {
      sprint = await Sprint.findOne({ name: key });
    }

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Populate the sprint with related data
    const populatedSprint = await Sprint.findById(sprint._id)
      .populate("project", "name key")
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate({
        path: "issues",
        select: "key title type storyPoints status assignee epic parent",
        populate: [
          {
            path: "assignee",
            select: "name email",
          },
          {
            path: "epic",
            select: "key title",
          },
          {
            path: "parent",
            select: "key title",
          },
        ],
      });
    console.log("Populated sprint:", populatedSprint);
    return NextResponse.json(populatedSprint);
  } catch (error) {
    console.error("Error fetching sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    await connectDB();

    // Find sprint by either ObjectId or name/key
    let sprint;
    if (isObjectId(key)) {
      sprint = await Sprint.findById(key).populate("project");
    } else {
      sprint = await Sprint.findOne({ name: key }).populate("project");
    }

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Check access permissions
    const project = sprint.project as unknown as { team: string };
    if (user.role !== "admin" && String(project.team) !== String(user.team)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update sprint
    const updatedSprint = await Sprint.findByIdAndUpdate(sprint._id, body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name key")
      .populate("team", "name")
      .populate("createdBy", "name email");

    return NextResponse.json(updatedSprint);
  } catch (error) {
    console.error("Error updating sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Find sprint by either ObjectId or name/key
    let sprint;
    if (isObjectId(key)) {
      sprint = await Sprint.findById(key).populate("project");
    } else {
      sprint = await Sprint.findOne({ name: key }).populate("project");
    }

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Check access permissions
    const project = sprint.project as unknown as { team: string };
    if (user.role !== "admin" && String(project.team) !== String(user.team)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Remove sprint reference from all issues
    await Issue.updateMany({ sprint: sprint._id }, { $unset: { sprint: 1 } });

    // Soft delete the sprint
    await Sprint.findByIdAndUpdate(sprint._id, {
      deletedAt: new Date(),
    });

    return NextResponse.json({ message: "Sprint deleted successfully" });
  } catch (error) {
    console.error("Error deleting sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
