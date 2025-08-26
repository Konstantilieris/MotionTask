import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Project, { IProject } from "@/models/Project";
import Issue from "@/models/Issue";
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
    let { key } = resolvedParams;

    console.log("GET - Original key from params:", key);

    // Decode URL-encoded characters (e.g., %CE%A6 -> Φ)
    try {
      const decodedKey = decodeURIComponent(key);
      console.log("GET - Decoded key:", decodedKey);
      key = decodedKey;
    } catch (error) {
      // If decoding fails, use the original key
      console.warn("GET - Failed to decode project key:", key, error);
    }

    console.log("GET - Final key for database query:", key);

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
        .populate({
          path: "team",
          select: "name slug members",
          populate: {
            path: "members",
            select: "name email role createdAt",
          },
        })
        .populate("createdBy", "name email");
    } else {
      project = await Project.findOne({ key })
        .populate({
          path: "team",
          select: "name slug members",
          populate: {
            path: "members",
            select: "name email role createdAt",
          },
        })
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
    let { key } = resolvedParams;

    // Decode URL-encoded characters (e.g., %CE%A6 -> Φ)
    try {
      key = decodeURIComponent(key);
    } catch (error) {
      // If decoding fails, use the original key
      console.warn("Failed to decode project key:", key, error);
    }

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
      .populate({
        path: "team",
        select: "name slug members",
        populate: {
          path: "members",
          select: "name email role createdAt",
        },
      })
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
    let { key } = resolvedParams;

    // Decode URL-encoded characters (e.g., %CE%A6 -> Φ)
    try {
      key = decodeURIComponent(key);
    } catch (error) {
      // If decoding fails, use the original key
      console.warn("Failed to decode project key:", key, error);
    }

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

    // Check if project has any issues before allowing deletion
    const issueCount = await Issue.countDocuments({
      project: project._id,
      deletedAt: null,
    });

    if (issueCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete project with existing issues",
          message: `This project contains ${issueCount} issue(s). Please delete or move all issues before deleting the project.`,
          issueCount,
        },
        { status: 400 }
      );
    }

    // Alternative approach: Cascade delete all issues (uncomment if you want this behavior)
    // if (issueCount > 0) {
    //   await Issue.updateMany(
    //     { project: project._id, deletedAt: null },
    //     {
    //       deletedAt: new Date(),
    //       updatedBy: new Types.ObjectId(currentUser._id as string)
    //     }
    //   );
    // }

    // Soft delete using findOneAndUpdate to avoid validation issues
    const updateData: Partial<IProject> = {
      deletedAt: new Date(),
      updatedBy: new Types.ObjectId(currentUser._id as string),
    };

    // Ensure createdBy is set if it's missing
    if (!project.createdBy) {
      updateData.createdBy = new Types.ObjectId(currentUser._id as string);
    }

    await Project.findByIdAndUpdate(
      project._id,
      updateData,
      { runValidators: false } // Skip validation since we're doing a soft delete
    );

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
