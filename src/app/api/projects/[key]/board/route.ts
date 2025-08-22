import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import { Types } from "mongoose";
import {
  BoardPayload,
  BoardIssue,
  BoardColumn,
  BoardGroup,
  SwimlaneType,
} from "@/types/board/types";

// Interface for populated issue fields
interface PopulatedIssue {
  _id: Types.ObjectId;
  key: string;
  type: string;
  status: string;
  rank?: string;
  position?: number;
  title: string;
  priority: string;
  labels: string[];
  storyPoints?: number;
  dueDate?: Date;
  assignee?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
  };
  epic?: {
    _id: Types.ObjectId;
    title: string;
    key: string;
  };
  parent?: {
    _id: Types.ObjectId;
    key: string;
    title: string;
  };
}

const BOARD_COLUMNS: BoardColumn[] = [
  { id: "backlog", name: "Backlog", color: "#6B7280" },
  { id: "todo", name: "To Do", color: "#3B82F6" },
  { id: "in-progress", name: "In Progress", color: "#8B5CF6" },
  { id: "done", name: "Done", color: "#10B981" },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const swimlane = (searchParams.get("swimlane") as SwimlaneType) || "none";
    const assigneeIds = searchParams.getAll("assigneeIds");
    const labels = searchParams.getAll("labels");
    const epicIds = searchParams.getAll("epicIds");
    const search = searchParams.get("search");
    const types = searchParams.getAll("types");

    await connectDB();

    const resolvedParams = await params;

    // Find project and verify access
    const project = await Project.findOne({
      key: resolvedParams.key,
      deletedAt: null,
    }).populate("team", "_id");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get current user to check team access
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to this project via team membership
    if (
      currentUser.role !== "admin" &&
      String(project.team._id) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query filters
    const query: Record<string, unknown> = {
      project: project._id,
      deletedAt: null,
    };

    if (assigneeIds.length > 0) {
      query.assignee = { $in: assigneeIds.map((id) => new Types.ObjectId(id)) };
    }

    if (labels.length > 0) {
      query.labels = { $in: labels };
    }

    if (epicIds.length > 0) {
      query.epic = { $in: epicIds.map((id) => new Types.ObjectId(id)) };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (types.length > 0) {
      query.type = { $in: types };
    }

    // Fetch issues with populated references
    const issues = await Issue.find(query)
      .populate("assignee", "name email")
      .populate("epic", "title key")
      .populate("parent", "key title")
      .sort({ status: 1, position: 1 }) // Use position for now since rank migration is not complete
      .lean();

    // Transform to BoardIssue format
    const boardIssues: BoardIssue[] = await Promise.all(
      issues.map(async (issue) => {
        const populatedIssue = issue as unknown as PopulatedIssue;

        const boardIssue: BoardIssue = {
          id: issue._id.toString(),
          key: issue.key,
          type: issue.type as BoardIssue["type"],
          status: issue.status,
          rank:
            issue.rank && issue.rank !== "M"
              ? issue.rank
              : issue.position?.toString() || "M",
          summary: issue.title,
          priority: issue.priority,
          labels: issue.labels,
          assignee:
            populatedIssue.assignee && populatedIssue.assignee.name
              ? {
                  id: populatedIssue.assignee._id.toString(),
                  name: populatedIssue.assignee.name,
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    populatedIssue.assignee.name
                  )}`,
                }
              : undefined,
          storyPoints: issue.storyPoints,
          epic:
            populatedIssue.epic && populatedIssue.epic.title
              ? {
                  id: populatedIssue.epic._id.toString(),
                  name: populatedIssue.epic.title,
                  color: "#3B82F6", // Default color, could be extended
                }
              : null,
          parent:
            populatedIssue.parent && populatedIssue.parent.key
              ? {
                  id: populatedIssue.parent._id.toString(),
                  key: populatedIssue.parent.key,
                  summary: populatedIssue.parent.title,
                }
              : null,
          dueDate: issue.dueDate?.toISOString(),
        };

        // Add subtask counts for parent issues
        if (issue.type !== "subtask") {
          const subtasks = await Issue.find({
            parent: issue._id,
            deletedAt: null,
          }).lean();

          const openBugs = await Issue.countDocuments({
            linkedIssues: issue._id,
            type: "bug",
            status: { $ne: "done" },
            deletedAt: null,
          });

          boardIssue.counts = {
            subtasksDone: subtasks.filter((s) => s.status === "done").length,
            subtasksTotal: subtasks.length,
            openBugs,
          };
        }

        return boardIssue;
      })
    );

    // Generate groups based on swimlane type
    const groups: BoardGroup[] = [];

    if (swimlane === "epic") {
      const epicMap = new Map<string, BoardGroup>();
      const ungroupedIssues: string[] = [];

      boardIssues.forEach((issue) => {
        if (issue.epic) {
          const epicKey = issue.epic.id;
          if (!epicMap.has(epicKey)) {
            epicMap.set(epicKey, {
              key: epicKey,
              type: "epic",
              title: issue.epic.name,
              color: issue.epic.color,
              issueIds: [],
            });
          }
          epicMap.get(epicKey)!.issueIds.push(issue.id);
        } else {
          ungroupedIssues.push(issue.id);
        }
      });

      groups.push(...Array.from(epicMap.values()));

      if (ungroupedIssues.length > 0) {
        groups.push({
          key: "no-epic",
          type: "epic",
          title: "No Epic",
          issueIds: ungroupedIssues,
        });
      }
    } else if (swimlane === "parent") {
      const parentMap = new Map<string, BoardGroup>();
      const topLevelIssues: string[] = [];

      boardIssues.forEach((issue) => {
        if (issue.parent) {
          const parentKey = issue.parent.id;
          if (!parentMap.has(parentKey)) {
            parentMap.set(parentKey, {
              key: parentKey,
              type: "parent",
              title: `${issue.parent.key}: ${issue.parent.summary}`,
              issueIds: [],
            });
          }
          parentMap.get(parentKey)!.issueIds.push(issue.id);
        } else {
          topLevelIssues.push(issue.id);
        }
      });

      groups.push(...Array.from(parentMap.values()));

      if (topLevelIssues.length > 0) {
        groups.push({
          key: "top-level",
          type: "parent",
          title: "Top Level Issues",
          issueIds: topLevelIssues,
        });
      }
    } else if (swimlane === "assignee") {
      const assigneeMap = new Map<string, BoardGroup>();
      const unassignedIssues: string[] = [];

      boardIssues.forEach((issue) => {
        if (issue.assignee) {
          const assigneeKey = issue.assignee.id;
          if (!assigneeMap.has(assigneeKey)) {
            assigneeMap.set(assigneeKey, {
              key: assigneeKey,
              type: "assignee",
              title: issue.assignee.name,
              issueIds: [],
            });
          }
          assigneeMap.get(assigneeKey)!.issueIds.push(issue.id);
        } else {
          unassignedIssues.push(issue.id);
        }
      });

      groups.push(...Array.from(assigneeMap.values()));

      if (unassignedIssues.length > 0) {
        groups.push({
          key: "unassigned",
          type: "assignee",
          title: "Unassigned",
          issueIds: unassignedIssues,
        });
      }
    }

    const payload: BoardPayload = {
      columns: BOARD_COLUMNS,
      swimlane,
      issues: boardIssues,
      groups: groups.length > 0 ? groups : undefined,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching board data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
