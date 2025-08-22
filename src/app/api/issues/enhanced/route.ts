import { NextResponse } from "next/server";
import { IssuesService } from "@/services/issues.service";
import { NotificationsService } from "@/services/notifications.service";
import { withAuth, AuthenticatedRequest } from "@/middleware/authz";
import connectDB from "@/lib/mongodb";

// Enhanced Issues Management API using new services
// This route provides atomic issue creation, advanced search, and notifications

// POST /api/issues/enhanced - Create issue with atomic numbering and AI suggestions
export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const body = await req.json();
      const {
        title,
        description,
        project,
        type = "task",
        priority = "medium",
        labels = [],
        storyPoints,
        epic,
        parent,
        assignee,
        sprint,
        dueDate,
      } = body;

      // Validate required fields
      if (!title || !project) {
        return NextResponse.json(
          { error: "Title and project are required" },
          { status: 400 }
        );
      }

      // Create issue using service
      const issue = await IssuesService.createIssue(
        {
          title,
          description,
          project,
          type,
          priority,
          labels,
          storyPoints,
          epic,
          parent,
          assignee,
          sprint,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        req.user!._id
      );

      if (!issue) {
        throw new Error("Failed to create issue");
      }

      // Send notifications
      await NotificationsService.notifyWatchers(
        (issue._id as { toString: () => string }).toString(),
        "issue_created",
        req.user!._id,
        {
          title: `New issue created: ${issue.key}`,
          message: `${title} has been created`,
          meta: { type, priority },
        }
      );

      if (assignee && assignee !== req.user!._id) {
        await NotificationsService.notifyAssignment(
          (issue._id as { toString: () => string }).toString(),
          assignee,
          req.user!._id
        );
      }

      return NextResponse.json(issue, { status: 201 });
    } catch (error) {
      console.error("Error creating issue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to create issue",
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, projectPermission: "edit" }
);

// PUT /api/issues/enhanced - Move issue (drag and drop)
export const PUT = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const body = await req.json();
      const { issueId, status, afterId, beforeId } = body;

      if (!issueId || !status) {
        return NextResponse.json(
          { error: "Issue ID and status are required" },
          { status: 400 }
        );
      }

      // Move issue using service
      const issue = await IssuesService.moveIssue(
        issueId,
        { status, afterId, beforeId },
        req.user!._id
      );

      if (!issue) {
        throw new Error("Failed to move issue");
      }

      // Notify watchers of status change
      await NotificationsService.notifyWatchers(
        issueId,
        "issue_updated",
        req.user!._id,
        {
          title: `Issue ${issue.key} moved`,
          message: `Status changed to ${status}`,
          meta: { status, action: "moved" },
        }
      );

      return NextResponse.json(issue);
    } catch (error) {
      console.error("Error moving issue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to move issue",
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, projectPermission: "edit" }
);

// PATCH /api/issues/enhanced - Update issue relationships
export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const body = await req.json();
      const { issueId, action, target } = body;

      if (!issueId || !action) {
        return NextResponse.json(
          { error: "Issue ID and action are required" },
          { status: 400 }
        );
      }

      let issue;
      let notificationMessage = "";

      switch (action) {
        case "set-epic":
          issue = await IssuesService.setEpic(issueId, target, req.user!._id);
          notificationMessage = `Epic set to ${target}`;
          break;

        case "set-parent":
          issue = await IssuesService.setParent(issueId, target, req.user!._id);
          notificationMessage = `Parent set to ${target}`;
          break;

        case "link-issue":
          issue = await IssuesService.addLinkedIssue(
            issueId,
            target,
            req.user!._id
          );
          notificationMessage = `Linked to ${target}`;
          break;

        case "unlink-issue":
          issue = await IssuesService.removeLinkedIssue(
            issueId,
            target,
            req.user!._id
          );
          notificationMessage = `Unlinked from ${target}`;
          break;

        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }

      if (!issue) {
        throw new Error("Failed to update issue");
      }

      // Notify watchers
      await NotificationsService.notifyWatchers(
        issueId,
        "issue_updated",
        req.user!._id,
        {
          title: `Issue ${issue.key} updated`,
          message: notificationMessage,
          meta: { action, target },
        }
      );

      return NextResponse.json(issue);
    } catch (error) {
      console.error("Error updating issue:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to update issue",
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, projectPermission: "edit" }
);

// GET /api/issues/enhanced - Enhanced search and retrieval
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const { searchParams } = new URL(req.url!);
      const projectId = searchParams.get("project");
      const query = searchParams.get("query");
      const key = searchParams.get("key");

      // Search by key
      if (key) {
        const issue = await IssuesService.getByKey(key);
        if (!issue) {
          return NextResponse.json(
            { error: "Issue not found" },
            { status: 404 }
          );
        }
        return NextResponse.json(issue);
      }

      // Search by query
      if (projectId && query) {
        const issues = await IssuesService.searchIssues(projectId, query);
        return NextResponse.json(issues);
      }

      return NextResponse.json(
        { error: "Either key or project+query parameters are required" },
        { status: 400 }
      );
    } catch (error) {
      console.error("Error searching issues:", error);
      return NextResponse.json(
        { error: "Failed to search issues" },
        { status: 500 }
      );
    }
  },
  { requireAuth: true, projectPermission: "view" }
);
