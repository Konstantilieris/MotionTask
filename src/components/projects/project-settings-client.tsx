"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";
import TeamManagement from "@/components/teams/team-management";

interface ProjectUser {
  _id: string;
  name: string;
  email: string;
}

interface ProjectTeam {
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
}

interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  status: string;
  priority: string;
  team: ProjectTeam;
  lead?: ProjectUser;
  createdBy?: ProjectUser;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSettingsClientProps {
  project: Project;
  userRole: string;
}

export default function ProjectSettingsClient({
  project,
  userRole,
}: ProjectSettingsClientProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState(project.priority);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      toast.loading("Updating project...");

      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update project");
      }

      toast.dismiss();
      toast.success("Project updated successfully!");

      // Refresh the page
      router.refresh();
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update project";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone and will delete all associated issues."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      toast.loading("Deleting project...");

      const response = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }

      toast.dismiss();
      toast.success("Project deleted successfully!");

      // Redirect to projects page
      router.push("/projects");
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete project";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusOptions = [
    { key: "planning", label: "Planning" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "on-hold", label: "On Hold" },
  ];

  const priorityOptions = [
    { key: "low", label: "Low" },
    { key: "medium", label: "Medium" },
    { key: "high", label: "High" },
    { key: "critical", label: "Critical" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 font-sans">
      {/* Header */}
      <motion.div
        className="bg-black/30 backdrop-blur-lg border-b border-white/5 px-8 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-6">
          <Link
            href={`/projects/${project.key}`}
            className="flex items-center text-gray-400 hover:text-white transition-all duration-300 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="ml-2 text-sm font-medium">Back to Project</span>
          </Link>
          <div className="border-l border-white/10 pl-6">
            <h1 className="text-3xl font-light text-white tracking-tight">
              Settings
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-mono">
              {project.key}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="max-w-5xl mx-auto p-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* General Settings */}
        <motion.div variants={itemVariants}>
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader className="pb-4">
              <h2 className="text-xl font-light text-white tracking-wide">
                General Settings
              </h2>
            </CardHeader>
            <Divider className="bg-white/5" />
            <CardBody className="pt-6">
              <form onSubmit={handleSave} className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <Input
                    label="Project Name"
                    color="success"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                    isDisabled={isLoading}
                    variant="bordered"
                    classNames={{
                      input: "text-white text-base",
                      label: "text-gray-300 text-sm",
                      inputWrapper:
                        "border-white/20 hover:border-white/40 focus-within:border-green-400/60 bg-white/5",
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Textarea
                    label="Description"
                    color="success"
                    placeholder="Enter project description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    isDisabled={isLoading}
                    variant="bordered"
                    minRows={3}
                    classNames={{
                      input: "text-white text-base",
                      label: "text-gray-300 text-sm",
                      inputWrapper:
                        "border-white/20 hover:border-white/40 focus-within:border-green-400/60 bg-white/5",
                    }}
                  />
                </motion.div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Select
                    label="Status"
                    color="success"
                    placeholder="Select status"
                    selectedKeys={[status]}
                    onSelectionChange={(keys) =>
                      setStatus(Array.from(keys)[0] as string)
                    }
                    isDisabled={isLoading}
                    variant="bordered"
                    classNames={{
                      label: "text-gray-300 text-sm",
                      value:
                        "text-white group-data-[has-value=true]:text-light-200",
                      trigger:
                        "border-white/20 hover:border-white/40 bg-white/5 text-white",

                      popoverContent:
                        "bg-neutral-800/95 backdrop-blur-xl border-white/20",
                      listboxWrapper: "bg-neutral-800/95",
                      listbox: "bg-transparent",
                    }}
                  >
                    {statusOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        className="text-white hover:bg-white/10"
                        textValue={option.label}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Priority"
                    color="success"
                    placeholder="Select priority"
                    selectedKeys={[priority]}
                    onSelectionChange={(keys) =>
                      setPriority(Array.from(keys)[0] as string)
                    }
                    isDisabled={isLoading}
                    variant="bordered"
                    classNames={{
                      label: "text-gray-300",
                      value:
                        "text-white group-data-[has-value=true]:text-light-200 ",

                      base: "bg-neutral-900 text-white rounded-lg",
                      popoverContent: "bg-neutral-700 text-white rounded-lg",
                      listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                      listbox: "bg-neutral-900 text-white rounded-lg",
                    }}
                  >
                    {priorityOptions.map((option) => (
                      <SelectItem
                        key={option.key}
                        color="default"
                        variant="bordered"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </motion.div>

                <motion.div
                  className="flex justify-end pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Button
                    type="submit"
                    color="success"
                    variant="ghost"
                    size="lg"
                    startContent={<Save className="h-4 w-4" />}
                    isLoading={isLoading}
                    className="border-green-400/30 hover:border-green-400/60 hover:bg-green-400/10 transition-all duration-300"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </motion.div>
              </form>
            </CardBody>
          </Card>
        </motion.div>

        {/* Team Management */}
        {userRole === "admin" && (
          <motion.div variants={itemVariants}>
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardBody className="p-0">
                <TeamManagement
                  team={project.team}
                  userRole={userRole}
                  onTeamUpdate={() => router.refresh()}
                />
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Danger Zone */}
        {userRole === "admin" && (
          <motion.div variants={itemVariants}>
            <Card className="bg-red-500/5 backdrop-blur-xl border border-red-500/20 shadow-2xl">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-light text-red-400 tracking-wide">
                  Danger Zone
                </h2>
              </CardHeader>
              <Divider className="bg-red-500/20" />
              <CardBody className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-medium text-lg">
                      Delete Project
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                      Once you delete a project, there is no going back. All
                      associated issues, comments, and project data will be
                      permanently removed.
                    </p>
                  </div>
                  <Button
                    color="danger"
                    variant="ghost"
                    size="lg"
                    startContent={<Trash2 className="h-4 w-4" />}
                    onPress={handleDelete}
                    isLoading={isDeleting}
                    className="border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 transition-all duration-300"
                  >
                    {isDeleting ? "Deleting..." : "Delete Project"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
