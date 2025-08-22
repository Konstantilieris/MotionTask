import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";

// GET /api/projects - Get all projects (filtered by team)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();

    let projects;
    if (currentUser.role === "admin") {
      // Admin can see all projects
      projects = await Project.find({ deletedAt: null })
        .populate("team", "name slug")
        .populate("lead", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see their team's projects
      projects = await Project.find({
        team: currentUser.team,
        deletedAt: null,
      })
        .populate("team", "name slug")
        .populate("lead", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
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

    // Only admin and members can create projects
    if (currentUser.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, status, priority } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate key from name (e.g., "My Project" -> "MP")
    const key = name
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 4);

    const project = new Project({
      name,
      key,
      description,
      status: status || "planning",
      priority: priority || "medium",
      team: currentUser.team,
      lead: session.user.id,
      updatedBy: session.user.id,
      createdBy: session.user.id,
    });

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("team", "name slug")
      .populate("lead", "name email")
      .populate("createdBy", "name email");

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: populatedProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
