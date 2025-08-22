"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import { revalidatePath } from "next/cache";

interface UpdateIssueDragParams {
  id: string;
  toStatus: string;
  toPos: number;
}

export async function updateIssueDrag({
  id,
  toStatus,
  toPos,
}: UpdateIssueDragParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Only admin and members can update issues
  if (currentUser.role === "viewer") {
    throw new Error("Forbidden");
  }

  await connectDB();

  // Get the issue and check permissions
  const issue = await Issue.findById(id).populate("project", "team");
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Check if user has access to this issue's project
  const projectTeam = (issue.project as unknown as { team: string }).team;
  if (
    currentUser.role !== "admin" &&
    String(projectTeam) !== String(currentUser.team)
  ) {
    throw new Error("Forbidden");
  }

  // Update the issue status and position
  await Issue.findByIdAndUpdate(id, {
    status: toStatus,
    position: toPos,
  });

  // Revalidate the project page
  const projectKey = (issue.project as unknown as { key: string }).key;
  revalidatePath(`/projects/${projectKey}`);

  return { success: true };
}

export async function createIssue(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Only admin and members can create issues
  if (currentUser.role === "viewer") {
    throw new Error("Forbidden");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const projectId = formData.get("projectId") as string;
  const assigneeId = formData.get("assigneeId") as string;
  const storyPoints = formData.get("storyPoints") as string;

  if (!title || !projectId) {
    throw new Error("Title and project are required");
  }

  await connectDB();

  // Verify project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (
    currentUser.role !== "admin" &&
    String(project.team) !== String(currentUser.team)
  ) {
    throw new Error("Forbidden");
  }

  // Generate issue key and number
  const lastIssue = await Issue.findOne({ project: projectId }).sort({
    issueNumber: -1,
  });
  const issueNumber = (lastIssue?.issueNumber || 0) + 1;
  const key = `${project.key}-${issueNumber}`;

  // Create the issue
  const issue = new Issue({
    title,
    description: description || undefined,
    type: type || "task",
    status: status || "todo",
    priority: priority || "medium",
    key,
    issueNumber,
    project: projectId,
    assignee: assigneeId || null,
    reporter: session.user.id,
    storyPoints: storyPoints ? parseInt(storyPoints) : null,
    position: 0, // Add to top of column
  });

  await issue.save();

  // Revalidate the project page
  revalidatePath(`/projects/${project.key}`);

  return {
    success: true,
    issueId: String(issue._id),
    issueKey: key,
  };
}

export async function deleteIssue(issueId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Only admin and members can delete issues
  if (currentUser.role === "viewer") {
    throw new Error("Forbidden");
  }

  await connectDB();

  // Get the issue and check permissions
  const issue = await Issue.findById(issueId).populate("project", "team key");
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Check if user has access to this issue's project
  const projectTeam = (issue.project as unknown as { team: string }).team;
  if (
    currentUser.role !== "admin" &&
    String(projectTeam) !== String(currentUser.team)
  ) {
    throw new Error("Forbidden");
  }

  // Soft delete the issue
  await Issue.findByIdAndUpdate(issueId, {
    deletedAt: new Date(),
  });

  // Revalidate the project page
  const projectKey = (issue.project as unknown as { key: string }).key;
  revalidatePath(`/projects/${projectKey}`);

  return { success: true };
}

export async function assignIssue(issueId: string, assigneeId: string | null) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    throw new Error("User not found");
  }

  // Only admin and members can assign issues
  if (currentUser.role === "viewer") {
    throw new Error("Forbidden");
  }

  await connectDB();

  // Get the issue and check permissions
  const issue = await Issue.findById(issueId).populate("project", "team key");
  if (!issue) {
    throw new Error("Issue not found");
  }

  // Check if user has access to this issue's project
  const projectTeam = (issue.project as unknown as { team: string }).team;
  if (
    currentUser.role !== "admin" &&
    String(projectTeam) !== String(currentUser.team)
  ) {
    throw new Error("Forbidden");
  }

  // Update the assignee
  await Issue.findByIdAndUpdate(issueId, {
    assignee: assigneeId,
  });

  // Revalidate the project page
  const projectKey = (issue.project as unknown as { key: string }).key;
  revalidatePath(`/projects/${projectKey}`);

  return { success: true };
}
