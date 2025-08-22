import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import { createIssueCreatedActivity } from "@/lib/api/activities";
import { rankInitial } from "@/utils/ranking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateIssueBody = z.object({
  project: z.string(),
  title: z.string().min(1),
  type: z.enum(["task", "bug", "story", "epic"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.string().optional(),
  labels: z.array(z.string()).optional(),
  storyPoints: z.number().int().positive().optional(),
  epic: z.string().nullable().optional(),
  parent: z.string().nullable().optional(),
  assignee: z.string().nullable().optional(),
  description: z.string().optional(),
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

      // Create the issue
      const [issue] = await Issue.create(
        [
          {
            ...dto,
            key,
            issueNumber,
            status: dto.status ?? "backlog",
            priority: dto.priority ?? "medium",
            resolution: "unresolved",
            watchers: [session.user.id],
            reporter: session.user.id,
            timeTracking: {},
            position: rankInitial(),
          },
        ],
        { session: mongoSession }
      );

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

    const issues = await Issue.find(query)
      .populate("project", "name key")
      .populate("reporter", "name email")
      .populate("assignee", "name email")
      .sort({ position: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
