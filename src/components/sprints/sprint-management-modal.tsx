"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
  Chip,
  Progress,
  Skeleton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Calendar,
  Target,
  Users,
  Plus,
  Activity,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import SprintModal from "./sprint-modal";

interface Sprint {
  _id: string;
  name: string;
  description?: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
  capacity?: number;
  velocity?: number;
  issues: Array<{
    _id: string;
    key: string;
    title: string;
    storyPoints?: number;
    status: string;
  }>;
  project: {
    _id: string;
    name: string;
    key: string;
  };
}

interface SprintManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const SprintManagementModal = ({
  isOpen,
  onClose,
  projectId,
}: SprintManagementModalProps) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deletingSprint, setDeletingSprint] = useState<string | null>(null);

  const fetchSprints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sprints?project=${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sprints");
      }
      const data = await response.json();
      setSprints(data);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      toast.error("Failed to load sprints");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchSprints();
    }
  }, [isOpen, projectId, fetchSprints]);

  const handleSprintCreated = (newSprint: Record<string, unknown>) => {
    // Convert the new sprint to match our Sprint interface
    const formattedSprint: Sprint = {
      _id: newSprint._id as string,
      name: newSprint.name as string,
      description: newSprint.description as string | undefined,
      goal: newSprint.goal as string | undefined,
      startDate: newSprint.startDate as string,
      endDate: newSprint.endDate as string,
      status: newSprint.status as "planned" | "active" | "completed",
      capacity: newSprint.capacity as number | undefined,
      velocity: newSprint.velocity as number | undefined,
      issues: [],
      project: { _id: projectId, name: "", key: "" },
    };
    setSprints((prev) => [formattedSprint, ...prev]);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
  };

  const handleSprintUpdated = (updatedSprint: Record<string, unknown>) => {
    setSprints((prev) =>
      prev.map((sprint) =>
        sprint._id === updatedSprint._id
          ? {
              ...sprint,
              name: updatedSprint.name as string,
              description: updatedSprint.description as string | undefined,
              goal: updatedSprint.goal as string | undefined,
              startDate: updatedSprint.startDate as string,
              endDate: updatedSprint.endDate as string,
              status: updatedSprint.status as
                | "planned"
                | "active"
                | "completed",
              capacity: updatedSprint.capacity as number | undefined,
            }
          : sprint
      )
    );
    setEditingSprint(null);
  };

  const handleDeleteSprint = async (sprintId: string) => {
    setDeletingSprint(sprintId);
    try {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sprint");
      }

      setSprints((prev) => prev.filter((sprint) => sprint._id !== sprintId));
      toast.success("Sprint deleted successfully");
    } catch (error) {
      console.error("Error deleting sprint:", error);
      toast.error("Failed to delete sprint");
    } finally {
      setDeletingSprint(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "default";
      case "planned":
        return "primary";
      default:
        return "default";
    }
  };

  const calculateProgress = (sprint: Sprint) => {
    const totalStoryPoints = sprint.issues.reduce(
      (sum, issue) => sum + (issue.storyPoints || 0),
      0
    );
    const completedStoryPoints = sprint.issues
      .filter((issue) => issue.status === "done")
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

    return totalStoryPoints > 0
      ? (completedStoryPoints / totalStoryPoints) * 100
      : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        placement="center"
        className="dark"
        backdrop="blur"
        classNames={{
          base: "mx-2 my-2 sm:mx-4 sm:my-4 max-h-[95vh] bg-gray-900/95 backdrop-blur-md border border-white/10",
          wrapper: "items-center justify-center",
          body: "p-4 sm:p-6 max-h-[80vh] bg-gray-900/50",
          header: "p-4 sm:p-6 pb-2 border-b border-white/10",
          footer: "p-4 sm:p-6 pt-2 border-t border-white/10",
        }}
      >
        <ModalContent className="bg-gray-900/95 backdrop-blur-md">
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white tracking-wide">
                  Sprint Management
                </h2>
              </div>
              <Button
                color="primary"
                variant="bordered"
                startContent={<Plus className="h-4 w-4" />}
                onPress={() => setShowCreateModal(true)}
                className="border-blue-400/30 hover:border-blue-400/60 text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10 mr-4"
              >
                Create Sprint
              </Button>
            </div>
            <p className="text-sm text-gray-400 font-normal">
              Manage your project sprints and track progress
            </p>
          </ModalHeader>

          <ModalBody className="gap-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/5 border border-white/10">
                    <CardBody>
                      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700" />
                      <Skeleton className="h-4 w-1/2 mb-4 bg-gray-700" />
                      <Skeleton className="h-2 w-full bg-gray-700" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : sprints.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No sprints yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Create your first sprint to start organizing your work
                </p>
                <Button
                  color="primary"
                  variant="bordered"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() => setShowCreateModal(true)}
                  className="border-blue-400/30 hover:border-blue-400/60 text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10"
                >
                  Create First Sprint
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sprints.map((sprint) => (
                  <Card
                    key={sprint._id}
                    className="bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {sprint.name}
                            </h3>
                            <Chip
                              size="sm"
                              color={getStatusColor(sprint.status)}
                              variant="flat"
                              className="capitalize bg-opacity-20 border border-current/20"
                            >
                              {sprint.status}
                            </Chip>
                          </div>
                          {sprint.goal && (
                            <p className="text-gray-300 text-sm mb-2 font-medium">
                              {sprint.goal}
                            </p>
                          )}
                          {sprint.description && (
                            <p className="text-gray-400 text-sm">
                              {sprint.description}
                            </p>
                          )}
                        </div>

                        {/* Actions Dropdown */}
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="text-gray-400 hover:text-gray-200 hover:bg-white/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu className="bg-gray-800 border border-white/20">
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="h-4 w-4" />}
                              onPress={() => handleEditSprint(sprint)}
                              className="text-gray-200 hover:text-white hover:bg-white/10"
                            >
                              Edit Sprint
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              startContent={<Trash2 className="h-4 w-4" />}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              color="danger"
                              onPress={() => handleDeleteSprint(sprint._id)}
                              isDisabled={deletingSprint === sprint._id}
                            >
                              {deletingSprint === sprint._id
                                ? "Deleting..."
                                : "Delete Sprint"}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      {/* Sprint Progress */}
                      {sprint.issues.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">
                              Progress
                            </span>
                            <span className="text-sm text-gray-400">
                              {
                                sprint.issues.filter((i) => i.status === "done")
                                  .length
                              }{" "}
                              of {sprint.issues.length} issues completed
                            </span>
                          </div>
                          <Progress
                            value={calculateProgress(sprint)}
                            color="success"
                            size="sm"
                            className="w-full"
                            classNames={{
                              base: "bg-gray-700/50",
                              indicator: "bg-green-400",
                            }}
                          />
                        </div>
                      )}

                      {/* Sprint Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {formatDate(sprint.startDate)} -{" "}
                            {formatDate(sprint.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {sprint.issues.length} issues
                          </span>
                        </div>
                        {sprint.capacity && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              {sprint.capacity} SP capacity
                            </span>
                          </div>
                        )}
                        {sprint.velocity && (
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              {sprint.velocity} SP velocity
                            </span>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <SprintModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onSprintCreated={handleSprintCreated}
      />

      {/* Edit Sprint Modal */}
      {editingSprint && (
        <SprintModal
          isOpen={!!editingSprint}
          onClose={() => setEditingSprint(null)}
          projectId={projectId}
          sprint={editingSprint}
          onSprintCreated={handleSprintUpdated}
        />
      )}
    </>
  );
};

export default SprintManagementModal;
