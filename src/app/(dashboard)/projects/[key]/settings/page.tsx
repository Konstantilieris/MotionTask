import { redirect, notFound } from "next/navigation";
import { getProjectForSettings } from "@/utils/query/project/server-project";
import ProjectSettingsClient from "@/components/projects/project-settings-client";

interface ProjectSettingsPageProps {
  params: Promise<{
    key: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  try {
    const { key } = await params;
    console.log("Fetching project settings for key:", key);
    if (!key) {
      console.error("No project key found");
      notFound();
    }
    const { project, userRole } = await getProjectForSettings(key);

    return <ProjectSettingsClient project={project} userRole={userRole} />;
  } catch (error) {
    const { key } = await params;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage === "Unauthorized" || errorMessage === "User not found") {
      redirect("/auth/signin");
    }

    if (errorMessage === "Project not found") {
      console.error("Project not found for settings:", key);
      notFound();
    }

    if (errorMessage === "Access denied") {
      console.error("Access denied for project settings:", key);
      redirect("/");
    }

    if (errorMessage === "Insufficient permissions") {
      console.error("Insufficient permissions for project settings:", key);
      redirect(`/projects/${key}`);
    }
    console.error("Error loading project settings:", error);
    // For any other errors, redirect to home
    redirect("/");
  }
}
