import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Issue from "@/models/Issue";
import User from "@/models/User";
import { AuthUtils } from "@/lib/auth-utils";

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

interface PopulatedTeam {
  _id: string;
  name: string;
  slug: string;
}

interface PopulatedProject {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status?: string;
  priority?: string;
  team: PopulatedTeam;
  lead?: PopulatedUser;
  createdBy?: PopulatedUser;
}

interface PopulatedIssue {
  _id: string;
  title: string;
  key: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
  position: number;
  storyPoints?: number;
  assignee?: PopulatedUser;
  reporter: PopulatedUser;
}

export interface TransformedProject {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  priority: string;
  team: {
    _id: string;
    name: string;
    slug: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
}

export interface TransformedIssue {
  _id: string;
  title: string;
  key: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
  position: number;
  storyPoints?: number;
  assignee?: {
    name: string;
    email: string;
  };
  reporter: {
    name: string;
    email: string;
  };
}

export interface IssuesByStatus {
  backlog: TransformedIssue[];
  todo: TransformedIssue[];
  "in-progress": TransformedIssue[];
  done: TransformedIssue[];
}

export async function getProjectWithIssues(projectKey: string) {
  // Decode URL-encoded characters (e.g., %CE%A6 -> Φ)
  let decodedProjectKey = projectKey;
  try {
    decodedProjectKey = decodeURIComponent(projectKey);
    console.log("Original projectKey:", projectKey);
    console.log("Decoded projectKey:", decodedProjectKey);
  } catch (error) {
    console.warn("Failed to decode project key:", projectKey, error);
  }

  const session = await getServerSession(authOptions);
  console.log("session:", session);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  console.log("Current user role:", currentUser.role);
  console.log("Current user data:", {
    id: currentUser._id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    team: currentUser.team,
  });

  await connectDB();

  // Find project by key
  const project = (await Project.findOne({
    key: decodedProjectKey,
    deletedAt: null,
  })
    .populate("team", "name slug")
    .populate("lead", "name email")
    .populate("createdBy", "name email")
    .lean()) as unknown as PopulatedProject;

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if user has access to this project
  if (
    currentUser.role !== "admin" &&
    String(project.team._id) !== String(currentUser.team)
  ) {
    throw new Error("Access denied");
  }

  // Get all issues for this project
  const issues = (await Issue.find({
    project: project._id,
    deletedAt: null,
  })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .sort({ position: 1 })
    .lean()) as unknown as PopulatedIssue[];
  console.log("Issues found:", issues);
  // Get team members for assignee options
  const teamMembers = await User.find({
    team: project.team._id,
    deletedAt: null,
  })
    .select("_id name email")
    .sort({ name: 1 });
  console.log("Team members found:", teamMembers);
  // Group issues by status
  const issuesByStatus: IssuesByStatus = {
    backlog: [],
    todo: [],
    "in-progress": [],
    done: [],
  };

  issues.forEach((issue) => {
    const transformedIssue: TransformedIssue = {
      _id: String(issue._id),
      title: issue.title,
      key: issue.key,
      description: issue.description,
      status: issue.status,
      type: issue.type,
      priority: issue.priority,
      position: issue.position,
      storyPoints: issue.storyPoints,
      assignee: issue.assignee
        ? {
            name: (issue.assignee as unknown as PopulatedUser).name,
            email: (issue.assignee as unknown as PopulatedUser).email,
          }
        : undefined,
      reporter: {
        name: (issue.reporter as unknown as PopulatedUser).name,
        email: (issue.reporter as unknown as PopulatedUser).email,
      },
    };

    if (issue.status in issuesByStatus) {
      issuesByStatus[issue.status as keyof IssuesByStatus].push(
        transformedIssue
      );
    }
  });
  console.log("Issues grouped by status:", issuesByStatus);

  // Transform project for components
  const transformedProject: TransformedProject = {
    _id: String(project._id),
    name: project.name,
    key: project.key,
    description: project.description,
    status: (project as unknown as PopulatedProject).status || "in-progress",
    priority: (project as unknown as PopulatedProject).priority || "medium",
    team: {
      _id: String((project.team as unknown as PopulatedTeam)._id),
      name: (project.team as unknown as PopulatedTeam).name,
      slug: (project.team as unknown as PopulatedTeam).slug,
    },
    createdBy: {
      name:
        (project as unknown as PopulatedProject).createdBy?.name || "Unknown",
      email:
        (project as unknown as PopulatedProject).createdBy?.email ||
        "unknown@example.com",
    },
  };

  return {
    project: transformedProject,
    issuesByStatus,
    userRole: currentUser.role,
    teamMembers: teamMembers.map((member) => ({
      id: String(member._id),
      name: member.name,
      email: member.email,
    })),
  };
}
