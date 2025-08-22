"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
} from "@heroui/react";

interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  priority: string;
  team: {
    name: string;
    slug: string;
  };
  lead: {
    name: string;
    email: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectTableProps {
  projects: Project[];
  userRole: string;
}

// Helper functions for HeroUI Chip colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "planning":
      return "warning" as const;
    case "in-progress":
      return "primary" as const;
    case "completed":
      return "success" as const;
    case "on-hold":
      return "default" as const;
    default:
      return "default" as const;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "default" as const;
    case "medium":
      return "warning" as const;
    case "high":
      return "secondary" as const;
    case "critical":
      return "danger" as const;
    default:
      return "default" as const;
  }
};

export default function ProjectTable({
  projects,
  userRole,
}: ProjectTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 px-4">
        <Target className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 animate-pulse" />
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-gray-100">
          No projects
        </h3>
        <p className="mt-2 text-sm sm:text-base text-gray-200 max-w-sm mx-auto">
          Get started by creating a new project.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-end">
          <Button
            size="md"
            variant="ghost"
            color="primary"
            onPress={() => setViewMode("table")}
            className="text-sm sm:text-base font-medium"
          >
            Table View
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              userRole={userRole}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="block sm:hidden">
          <Button
            size="md"
            variant="ghost"
            color="primary"
            onPress={() => setViewMode("grid")}
            className="text-sm font-medium"
          >
            Grid View
          </Button>
        </div>
        <div className="hidden sm:flex justify-end w-full">
          <Button
            size="md"
            variant="ghost"
            color="primary"
            onPress={() => setViewMode("grid")}
            className="text-sm sm:text-base font-medium"
          >
            Grid View
          </Button>
        </div>
      </div>

      {/* Mobile: Show grid view on small screens */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              userRole={userRole}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Show table view on larger screens */}
      <div className="hidden sm:block overflow-x-auto">
        <Table
          aria-label="Projects table"
          classNames={{
            wrapper:
              "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg min-w-full",
            th: "bg-gray-50/10 text-gray-200 text-sm lg:text-base font-semibold py-3 lg:py-4 whitespace-nowrap",
            td: "text-gray-100 text-sm lg:text-base py-3 lg:py-4",
            table: "text-sm lg:text-base min-w-full",
          }}
        >
          <TableHeader>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[200px]">
              PROJECT
            </TableColumn>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[120px]">
              STATUS
            </TableColumn>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[120px]">
              PRIORITY
            </TableColumn>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[150px]">
              TEAM
            </TableColumn>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[150px]">
              LEAD
            </TableColumn>
            <TableColumn className="text-sm lg:text-base font-bold min-w-[120px]">
              CREATED
            </TableColumn>
            <TableColumn
              align="end"
              className="text-sm lg:text-base font-bold min-w-[100px]"
            >
              ACTIONS
            </TableColumn>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project._id}>
                <TableCell>
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/projects/${project.key}`}
                      className="text-sm lg:text-base font-semibold text-gray-100 hover:text-blue-400 transition-colors block truncate"
                    >
                      {project.name}
                    </Link>

                    {project.description && (
                      <div className="text-xs lg:text-sm text-gray-400 truncate max-w-[200px] lg:max-w-xs">
                        {project.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="md"
                    color={getStatusColor(project.status)}
                    variant="flat"
                    className="text-white font-medium text-xs lg:text-sm"
                  >
                    {project.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="md"
                    color={getPriorityColor(project.priority)}
                    variant="flat"
                    className="text-white font-medium text-xs lg:text-sm"
                  >
                    {project.priority}
                  </Chip>
                </TableCell>
                <TableCell className="text-gray-100 text-sm lg:text-base font-medium">
                  <div className="truncate max-w-[120px] lg:max-w-none">
                    {project.team.name}
                  </div>
                </TableCell>
                <TableCell className="text-gray-100 text-sm lg:text-base font-medium">
                  <div className="truncate max-w-[120px] lg:max-w-none">
                    {project.lead.name}
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 text-sm lg:text-base">
                  <div className="whitespace-nowrap">
                    {format(new Date(project.createdAt), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <ProjectActions project={project} userRole={userRole} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  userRole,
}: {
  project: Project;
  userRole: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-6 lg:p-8 hover:shadow-xl hover:bg-white/15 transition-all duration-300">
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <Link
            href={`/projects/${project.key}`}
            className="text-lg sm:text-xl font-bold text-gray-100 hover:text-blue-400 transition-colors block truncate"
          >
            {project.name}
          </Link>
          <p className="text-sm sm:text-base text-gray-400 mt-1 font-medium truncate">
            {project.key}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <ProjectActions project={project} userRole={userRole} />
        </div>
      </div>

      {project.description && (
        <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Chip
          size="md"
          color={getStatusColor(project.status)}
          variant="flat"
          className="font-medium text-xs sm:text-sm"
        >
          {project.status}
        </Chip>
        <Chip
          size="md"
          color={getPriorityColor(project.priority)}
          variant="flat"
          className="font-medium text-xs sm:text-sm"
        >
          {project.priority}
        </Chip>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-sm sm:text-base text-gray-400">
        <div className="flex items-center font-medium">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
          <span className="truncate">{project.team.name}</span>
        </div>
        <div className="flex items-center font-medium">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {format(new Date(project.createdAt), "MMM d")}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectActions({
  project,
  userRole,
}: {
  project: Project;
  userRole: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      toast.loading("Deleting project...");

      const response = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.dismiss();
      toast.success("Project deleted successfully");

      // Refresh the page to update the project list
      router.refresh();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to delete project");
      console.error("Error deleting project:", error);
    }
  };

  const items = [
    {
      key: "view",
      label: "View Board",
      icon: <Eye className="h-4 w-4" />,
      href: `/projects/${project.key}`,
    },
    ...(userRole !== "viewer"
      ? [
          {
            key: "settings",
            label: "Settings",
            icon: <Edit className="h-4 w-4" />,
            href: `/projects/${project.key}/settings`,
          },
        ]
      : []),
    ...(userRole === "admin" || userRole === "member"
      ? [
          {
            key: "delete",
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            className: "text-danger",
            color: "danger" as const,
            onPress: handleDelete,
          },
        ]
      : []),
  ];

  return (
    <Dropdown
      classNames={{
        trigger: "text-gray-400 hover:text-gray-300 transition-colors",
        content:
          "bg-neutral-800 py-2 sm:py-4 border border-white/20 rounded-lg",
      }}
    >
      <DropdownTrigger>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-gray-400 hover:text-gray-300 hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Project actions"
        className="text-sm sm:text-base"
      >
        {items.map((item) => (
          <DropdownItem
            key={item.key}
            startContent={item.icon}
            href={item.href}
            className={`${item.className} text-sm sm:text-base py-2 sm:py-3 text-light-100`}
            color={item.color}
            onPress={item.onPress}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
