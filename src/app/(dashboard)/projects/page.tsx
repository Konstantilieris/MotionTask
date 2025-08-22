import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjects, getCurrentUser } from "@/utils/query/project";
import ProjectTable from "@/components/projects/project-table";
import NewProjectButton from "@/components/projects/new-project-button";
import CreateProjectModal from "@/components/projects/create-project-modal";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/signin");
  }

  try {
    const projects = await getProjects();
    if (!projects) {
      return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 font-sans flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">
              No Projects Found
            </h1>
            <p className="text-gray-200 text-sm sm:text-base">
              You currently have no projects. Create one to get started!
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 font-sans flex flex-col bg-dark-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-light-100">
              Projects
            </h1>
            <p className="text-gray-300 mt-1 text-sm sm:text-base">
              Manage your team&apos;s projects and track progress
            </p>
          </div>
          {currentUser.role !== "viewer" && (
            <div className="flex-shrink-0">
              <NewProjectButton />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <ProjectTable projects={projects} userRole={currentUser.role} />
        </div>
        <CreateProjectModal />
      </div>
    );
  } catch (error) {
    console.error("Error loading projects:", error);
    return (
      <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4 animate-pulse">
            Error Loading Projects
          </h1>
          <p className="text-gray-200 text-sm sm:text-base">
            There was an error loading your projects. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
