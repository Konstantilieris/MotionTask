import { redirect, notFound } from "next/navigation";
import { getProjectWithIssues } from "@/utils/query/project/project-detail";
import { EnhancedKanbanBoard } from "@/components/board/enhanced";
import ProjectHeader from "@/components/projects/project-header";
import FilterSummary from "@/components/board/filter-summary";

interface ProjectPageProps {
  params: Promise<{
    key: string;
  }>;
  searchParams: Promise<{
    created?: string;
  }>;
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  try {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const { project, userRole, teamMembers } = await getProjectWithIssues(
      resolvedParams.key
    );

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 font-sans">
        <ProjectHeader
          project={project}
          userRole={userRole}
          teamMembers={teamMembers}
          createdIssueId={resolvedSearchParams.created}
        />

        <FilterSummary />

        <div className="flex-1 overflow-hidden min-h-0">
          <EnhancedKanbanBoard projectKey={project.key} />
        </div>
      </div>
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage === "Unauthorized") {
      redirect("/auth/signin");
    }

    if (errorMessage === "Project not found") {
      notFound();
    }

    if (errorMessage === "Access denied") {
      redirect("/");
    }

    // For any other errors, redirect to projects page
    redirect("/projects");
  }
}
