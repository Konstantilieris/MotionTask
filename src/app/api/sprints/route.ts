import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Sprint from "@/models/Sprint";
import Project from "@/models/Project";
import { AuthUtils } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project");
    const status = searchParams.get("status");
    console.log("Fetching sprints for project:", projectId);
    await connectDB();

    const query: Record<string, unknown> = {};

    // If projectId is provided, filter by project
    if (projectId) {
      // Verify user has access to the project
      const project = await Project.findById(projectId);

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      console.log("Fetched project:", project);

      // Check if user has access to this project
      if (user.role !== "admin" && String(project.team) !== String(user.team)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      query.project = projectId;
    } else {
      // If no project specified, filter by user's team
      if (user.role !== "admin") {
        const userProjects = await Project.find({ team: user.team }).select(
          "_id"
        );
        query.project = { $in: userProjects.map((p) => p._id) };
      }
    }

    // Filter by status if provided
    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(",").map((s) => s.trim());
      if (statusArray.length === 1) {
        query.status = status;
      } else {
        query.status = { $in: statusArray };
      }
    }

    const sprints = await Sprint.find(query)
      .populate("project", "name key")
      .populate("team", "name")
      .populate("createdBy", "name email")
      .populate({
        path: "issues",
        select: "key title type storyPoints status",
        populate: {
          path: "assignee",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });
    console.log("Fetched sprints:", sprints);
    return NextResponse.json(sprints);
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin and members can create sprints
    if (user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      goal,
      startDate,
      endDate,
      project: projectId,
      capacity,
    } = body;

    if (!name || !startDate || !endDate || !projectId) {
      return NextResponse.json(
        { error: "Name, start date, end date, and project are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role !== "admin" && String(project.team) !== String(user.team)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const sprint = new Sprint({
      name,
      description,
      goal,
      startDate: start,
      endDate: end,
      project: projectId,
      team: project.team,
      capacity,
      createdBy: user._id,
    });

    await sprint.save();

    const populatedSprint = await Sprint.findById(sprint._id)
      .populate("project", "name key")
      .populate("team", "name")
      .populate("createdBy", "name email");

    return NextResponse.json(populatedSprint, { status: 201 });
  } catch (error) {
    console.error("Error creating sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
