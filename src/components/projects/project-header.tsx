"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Settings,
  Plus,
  Filter,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useModalStore } from "@/lib/stores/modal-store";
import { useFilterStore } from "@/lib/stores/filter-store";
import { Button, Chip } from "@heroui/react";
import FilterModal from "@/components/board/filter-modal";
import SprintManagementModal from "@/components/sprints/sprint-management-modal";

interface Project {
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
  lead?: {
    name: string;
    email: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
}

interface ProjectHeaderProps {
  project: Project;
  userRole: string;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  createdIssueId?: string;
}

const statusColors = {
  planning: "warning" as const,
  "in-progress": "primary" as const,
  completed: "success" as const,
  "on-hold": "default" as const,
};

export default function ProjectHeader({
  project,
  userRole,
  teamMembers,
  createdIssueId,
}: ProjectHeaderProps) {
  const { openModal } = useModalStore();
  const { filters } = useFilterStore();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);

  console.log("ProjectHeader - userRole:", userRole);
  console.log(
    "ProjectHeader - Should show Sprint button:",
    userRole !== "viewer"
  );

  const getActiveFilterCount = () => {
    return (
      filters.assignee.length +
      filters.type.length +
      filters.priority.length +
      (filters.searchQuery ? 1 : 0)
    );
  };

  // Show success message if issue was just created
  useEffect(() => {
    if (createdIssueId) {
      // You could show a toast notification here
      console.log("Issue created successfully:", createdIssueId);
    }
  }, [createdIssueId]);

  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link
            href="/projects"
            className="flex items-center text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="ml-1 text-sm font-medium">Projects</span>
          </Link>

          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-light text-white tracking-tight">
                {project.name}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-sm text-gray-400 font-mono">
                  {project.key}
                </span>
                <Chip
                  size="md"
                  color={
                    statusColors[project.status as keyof typeof statusColors] ||
                    "default"
                  }
                  variant="flat"
                  className="text-gray-100 capitalize"
                >
                  {project.status}
                </Chip>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            startContent={<Filter className="h-4 w-4" />}
            endContent={
              getActiveFilterCount() > 0 && (
                <Chip
                  size="sm"
                  color="primary"
                  variant="solid"
                  className="ml-1 min-w-5 h-5 text-xs"
                >
                  {getActiveFilterCount()}
                </Chip>
              )
            }
            onPress={() => setShowFilterModal(true)}
            className="text-gray-400 hover:text-white border-white/20 hover:border-white/40"
          >
            Filter
          </Button>

          {userRole !== "viewer" && (
            <Button
              variant="ghost"
              size="sm"
              startContent={<Calendar className="h-4 w-4" />}
              onPress={() => setShowSprintModal(true)}
              className="text-gray-400 hover:text-white border-white/20 hover:border-white/40"
            >
              Sprints
            </Button>
          )}

          {userRole !== "viewer" && (
            <Button
              as={Link}
              href={`/projects/${project.key}/sprints`}
              variant="ghost"
              size="sm"
              startContent={<BarChart3 className="h-4 w-4" />}
              className="text-gray-400 hover:text-white border-white/20 hover:border-white/40"
            >
              Analytics
            </Button>
          )}

          {userRole === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              startContent={<Calendar className="h-4 w-4" />}
              onPress={() => setShowSprintModal(true)}
              className="text-blue-400 hover:text-blue-300 border-blue-400/30 hover:border-blue-400/60"
            >
              Sprint Management
            </Button>
          )}

          {userRole !== "viewer" && (
            <Button
              variant="ghost"
              size="sm"
              color="success"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() =>
                openModal("issue-create", { projectId: project._id })
              }
              className="text-green-400 hover:text-green-300 border-green-400/30 hover:border-green-400/60"
            >
              Create Issue
            </Button>
          )}

          {userRole !== "viewer" && (
            <Button
              as={Link}
              href={`/projects/${project.key}/settings`}
              variant="ghost"
              size="sm"
              isIconOnly
              className="text-gray-400 hover:text-white border-white/20 hover:border-white/40"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {project.description && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">
            {project.description}
          </p>
        </div>
      )}

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        availableAssignees={teamMembers}
      />

      <SprintManagementModal
        isOpen={showSprintModal}
        onClose={() => setShowSprintModal(false)}
        projectId={project._id}
      />
    </div>
  );
}
