// Server-side API helpers for issues (direct database access)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import { Types } from "mongoose";

// Helper function to check if a string is a valid ObjectId
function isObjectId(str: string): boolean {
  return (
    Types.ObjectId.isValid(str) && new Types.ObjectId(str).toString() === str
  );
}

// Helper function to serialize MongoDB objects
function serializeIssue(issue: Record<string, unknown>) {
  return {
    _id: issue._id?.toString() || "",
    key: issue.key as string,
    issueNumber: issue.issueNumber as number,
    title: issue.title as string,
    description: issue.description as string,
    status: issue.status as string,
    type: issue.type as string,
    priority: issue.priority as string,
    position: issue.position as number,
    project: (issue.project as Record<string, unknown>)?._id
      ? (issue.project as Record<string, unknown>)._id?.toString()
      : (issue.project as string),
    reporter: issue.reporter
      ? {
          _id:
            (issue.reporter as Record<string, unknown>)._id?.toString() || "",
          name: (issue.reporter as Record<string, unknown>).name as string,
          email: (issue.reporter as Record<string, unknown>).email as string,
        }
      : {
          _id: "",
          name: "",
          email: "",
        },
    assignee: issue.assignee
      ? {
          _id:
            (issue.assignee as Record<string, unknown>)._id?.toString() || "",
          name: (issue.assignee as Record<string, unknown>).name as string,
          email: (issue.assignee as Record<string, unknown>).email as string,
        }
      : undefined,
    labels: (issue.labels as string[]) || [],
    storyPoints: issue.storyPoints as number,
    epic: (issue.epic as Record<string, unknown>)?._id
      ? (issue.epic as Record<string, unknown>)._id?.toString()
      : (issue.epic as string),
    parent: (issue.parent as Record<string, unknown>)?._id
      ? (issue.parent as Record<string, unknown>)._id?.toString()
      : (issue.parent as string),
    linkedIssues:
      (issue.linkedIssues as unknown[])?.map((id: unknown) =>
        typeof id === "object" && id !== null
          ? (id as Record<string, unknown>)._id?.toString() || ""
          : id?.toString() || ""
      ) || [],
    watchers:
      (issue.watchers as unknown[])?.map((id: unknown) =>
        typeof id === "object" && id !== null
          ? (id as Record<string, unknown>)._id?.toString() || ""
          : id?.toString() || ""
      ) || [],
    resolution: issue.resolution as string,
    resolutionDate: issue.resolutionDate as Date,
    dueDate: issue.dueDate as Date,
    timeTracking: (issue.timeTracking as Record<string, unknown>) || {},
    createdAt: issue.createdAt as Date,
    updatedAt: issue.updatedAt as Date,
  };
}

export async function getIssueByKeyServer(key: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      throw new Error("User not found");
    }

    await connectDB();

    // Try to find by ObjectId first, then by key
    let issue;
    if (isObjectId(key)) {
      issue = await Issue.findById(key)
        .populate("project", "name key team")
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("parent", "title key")
        .populate("epic", "title key")
        .lean(); // Use lean() for better performance and cleaner serialization
    } else {
      issue = await Issue.findOne({ key: key, deletedAt: null })
        .populate("project", "name key team")
        .populate("assignee", "name email")
        .populate("reporter", "name email")
        .populate("parent", "title key")
        .populate("epic", "title key")
        .lean();
    }

    if (!issue) {
      throw new Error("Issue not found");
    }

    // Check if user has access to this issue's project
    const projectTeam = (issue.project as unknown as Record<string, unknown>)
      ?.team;
    if (
      currentUser.role !== "admin" &&
      String(projectTeam) !== String(currentUser.team)
    ) {
      throw new Error("Forbidden");
    }

    return serializeIssue(issue);
  } catch (error) {
    console.error("Error fetching issue server-side:", error);
    throw error;
  }
}
