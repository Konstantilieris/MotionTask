import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import { createIssueCreatedActivity } from "@/lib/api/activities";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateIssueBody = z.object({
  project: z.string(),
  title: z.string().min(1).max(255),
  type: z.enum(["task", "bug", "story", "epic", "subtask"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.string().optional(),
  labels: z.array(z.string()).optional(),
  storyPoints: z.number().int().min(1).max(1000).optional(),
  dueDate: z.string().optional(),
  sprint: z.string().nullable().optional(),
  epic: z.string().nullable().optional(),
  parent: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  description: z.string().optional(),
  timeTracking: z
    .object({
      originalEstimate: z.number().min(0).nullable().optional(),
      remainingEstimate: z.number().min(0).nullable().optional(),
      timeSpent: z.number().min(0).nullable().optional(),
    })
    .optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        url: z.string(),
        mimeType: z.string(),
        size: z.number(),
      })
    )
    .optional(),
});

// POST /api/issues - Create issue with atomic numbering
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dto = CreateIssueBody.parse(await req.json());
    await connectDB();

    const mongoSession = await Issue.startSession();
    mongoSession.startTransaction();

    try {
      // Get project and atomically increment issue counter
      const proj = await Project.findById(dto.project).session(mongoSession);
      if (!proj) {
        throw new Error("Project not found");
      }

      const updated = await Project.findByIdAndUpdate(
        proj._id,
        { $inc: { issueCounter: 1 } },
        { new: true, session: mongoSession }
      );

      const issueNumber = updated!.issueCounter;
      const key = `${proj.key}-${issueNumber}`;

      // Prepare time tracking data
      const timeTracking = {
        originalEstimate: dto.timeTracking?.originalEstimate || undefined,
        remainingEstimate: dto.timeTracking?.remainingEstimate || undefined,
        timeSpent: dto.timeTracking?.timeSpent || undefined,
      };

      // Prepare attachments if any
      const attachments =
        dto.attachments?.map((att) => ({
          ...att,
          uploadedBy: new Types.ObjectId(session.user.id),
          uploadedAt: new Date(),
        })) || [];

      // Create the issue using the model's createIssue method for proper error handling
      const issue = await Issue.createIssue({
        project: new Types.ObjectId(dto.project),
        title: dto.title,
        description: dto.description,
        key,
        issueNumber,
        status: (dto.status ?? "todo") as
          | "todo"
          | "backlog"
          | "in-progress"
          | "done",
        type: dto.type ?? "task",
        priority: dto.priority ?? "medium",
        labels: dto.labels ?? [],
        storyPoints: dto.storyPoints,
        sprint: dto.sprint ? new Types.ObjectId(dto.sprint) : undefined,
        epic: dto.epic ? new Types.ObjectId(dto.epic) : undefined,
        parent: dto.parent ? new Types.ObjectId(dto.parent) : undefined,
        assignee: dto.assignee ? new Types.ObjectId(dto.assignee) : undefined,
        resolution: "unresolved",
        watchers: [new Types.ObjectId(session.user.id)],
        reporter: new Types.ObjectId(session.user.id),
        timeTracking,
        attachments,
        rank: "M", // Initial LexoRank value
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      });

      // Log activity
      await createIssueCreatedActivity(
        String(issue._id),
        session.user.id,
        mongoSession
      );

      await mongoSession.commitTransaction();

      return NextResponse.json(issue, { status: 201 });
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (err: unknown) {
    console.error("Error creating issue:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/issues - List issues (keeping existing functionality)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignee = searchParams.get("assignee");
    const type = searchParams.get("type");

    await connectDB();

    // Build query
    const query: Record<string, unknown> = { deletedAt: null };

    if (projectId) {
      query.project = projectId;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (assignee) {
      // Handle "me" as current user
      if (assignee === "me") {
        query.assignee = session.user.id;
      } else {
        query.assignee = assignee;
      }
    }
    if (type) {
      // Handle multiple types separated by comma
      const types = type.split(",");
      if (types.length > 1) {
        query.type = { $in: types };
      } else {
        query.type = type;
      }
    }

    const issues = await Issue.find(query)
      .populate("project", "name key")
      .populate("reporter", "name email")
      .populate("assignee", "name email")
      .sort({ rank: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
