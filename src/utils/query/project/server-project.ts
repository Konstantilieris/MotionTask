import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";

interface ProjectData {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  priority: string;
  lead: {
    name: string;
    email: string;
  };
  team: {
    name: string;
    slug: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

interface PopulatedTeam {
  _id: string;
  name: string;
  slug: string;
  members?: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;
}

interface PopulatedProject {
  _id: string;
  name: string;
  key: string;
  description?: string;
  team: PopulatedTeam;
  lead?: PopulatedUser;
  createdBy?: PopulatedUser;
  createdAt: Date;
  updatedAt: Date;
}

export async function getProjects(): Promise<ProjectData[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  await connectDB();

  let projectsRaw;
  if (currentUser.role === "admin") {
    projectsRaw = await Project.find({ deletedAt: null })
      .populate("team", "name slug")
      .populate("createdBy", "name email")
      .populate("lead", "name email")
      .sort({ createdAt: -1 })
      .lean();
  } else {
    projectsRaw = await Project.find({
      team: currentUser.team,
      deletedAt: null,
    })
      .populate("team", "name slug")
      .populate("createdBy", "name email")
      .populate("lead", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }
  console.log("Fetched projects:", projectsRaw);
  // Transform projects to match the expected interface
  const projects = projectsRaw.map((project) => ({
    _id: String(project._id),
    name: project.name,
    key: project.key,
    description: project.description,
    status: (project as unknown as { status?: string }).status || "in-progress",
    priority:
      (project as unknown as { priority?: string }).priority || "medium",
    team: {
      name: (project.team as unknown as PopulatedTeam).name,
      slug: (project.team as unknown as PopulatedTeam).slug,
    },
    lead: {
      name:
        (project as unknown as { lead?: PopulatedUser }).lead?.name ||
        "Unknown",
      email:
        (project as unknown as { lead?: PopulatedUser }).lead?.email ||
        "unknown@example.com",
    },
    createdBy: {
      name:
        (project as unknown as { createdBy?: PopulatedUser }).createdBy?.name ||
        "Unknown",
      email:
        (project as unknown as { createdBy?: PopulatedUser }).createdBy
          ?.email || "unknown@example.com",
    },
    createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
  }));

  return projects;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  return currentUser;
}

interface ProjectSettingsData {
  _id: string;
  name: string;
  key: string;
  description: string;
  status: string;
  priority: string;
  team: {
    _id: string;
    name: string;
    slug: string;
    members: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  };
  lead?: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getProjectForSettings(projectKey: string): Promise<{
  project: ProjectSettingsData;
  userRole: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  await connectDB();

  // Find project by key
  const project = (await Project.findOne({
    key: projectKey,
    deletedAt: null,
  })
    .populate("team", "name slug members")
    .populate("lead", "name email")
    .populate("createdBy", "name email")
    .lean()) as PopulatedProject | null;

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

  // Check if user has permission to access settings
  if (currentUser.role === "viewer") {
    throw new Error("Insufficient permissions");
  }

  // Transform project for client component - ensure all values are serializable
  const transformedProject: ProjectSettingsData = {
    _id: String(project._id),
    name: project.name,
    key: project.key,
    description: project.description || "",
    status: "in-progress",
    priority: "medium",
    team: {
      _id: String(project.team._id),
      name: project.team.name,
      slug: project.team.slug,
      members: Array.isArray(project.team.members)
        ? project.team.members.map((member) => ({
            _id: String(member._id),
            name: member.name,
            email: member.email,
            role: member.role,
            createdAt: member.createdAt
              ? new Date(member.createdAt).toISOString()
              : new Date().toISOString(),
          }))
        : [],
    },
    lead: project.lead
      ? {
          _id: String(project.lead._id),
          name: project.lead.name,
          email: project.lead.email,
        }
      : undefined,
    createdBy: project.createdBy
      ? {
          _id: String(project.createdBy._id),
          name: project.createdBy.name,
          email: project.createdBy.email,
        }
      : undefined,
    createdAt: new Date(project.createdAt).toISOString(),
    updatedAt: new Date(project.updatedAt).toISOString(),
  };

  return {
    project: transformedProject,
    userRole: currentUser.role,
  };
}
