import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import { Types } from "mongoose";

function isObjectId(str: string): boolean {
  return Types.ObjectId.isValid(str) && str.length === 24;
}

interface RouteParams {
  params: Promise<{
    key: string;
  }>;
}

// GET /api/projects/[key] - Get project by ID or key
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
    console.log("Connected to database");
    // Find project by either ObjectId or key
    let project;
    if (isObjectId(key)) {
      project = await Project.findById(key)
        .populate("team", "name slug")
        .populate("createdBy", "name email");
    } else {
      project = await Project.findOne({ key })
        .populate("team", "name slug")
        .populate("createdBy", "name email");
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    if (
      currentUser.role !== "admin" &&
      String(project.team._id) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[key] - Update project
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

    // Only admin and members can update projects
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;
    const { name, description, status, priority } = await request.json();

    await connectDB();

    // Find project by either ObjectId or key
    let existingProject;
    if (isObjectId(key)) {
      existingProject = await Project.findById(key);
    } else {
      existingProject = await Project.findOne({ key });
    }

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (
      currentUser.role !== "admin" &&
      String(existingProject.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: {
      name?: string;
      key?: string;
      description?: string;
      status?: string;
      priority?: string;
    } = {};

    if (name) {
      updateData.name = name;
      // Update key based on new name
      updateData.key = name
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("")
        .substring(0, 4);
    }
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const project = await Project.findByIdAndUpdate(
      existingProject._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("team", "name slug")
      .populate("createdBy", "name email");

    return NextResponse.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[key] - Delete project (admin and members only)
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

    // Only admin and members can delete projects
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;

    await connectDB();

    // Find project by either ObjectId or key
    let project;
    if (isObjectId(key)) {
      project = await Project.findById(key);
    } else {
      project = await Project.findOne({ key });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    if (
      currentUser.role !== "admin" &&
      String(project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    project.deletedAt = new Date();
    await project.save();

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
