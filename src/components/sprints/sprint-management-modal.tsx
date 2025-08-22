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
        size="4xl"
        scrollBehavior="inside"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Sprint Management</h2>
              </div>
              <Button
                color="primary"
                startContent={<Plus className="h-4 w-4" />}
                onPress={() => setShowCreateModal(true)}
              >
                Create Sprint
              </Button>
            </div>
            <p className="text-sm text-gray-500 font-normal">
              Manage your project sprints and track progress
            </p>
          </ModalHeader>

          <ModalBody className="gap-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardBody>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-2 w-full" />
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : sprints.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sprints yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first sprint to start organizing your work
                </p>
                <Button
                  color="primary"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() => setShowCreateModal(true)}
                >
                  Create First Sprint
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sprints.map((sprint) => (
                  <Card
                    key={sprint._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">
                              {sprint.name}
                            </h3>
                            <Chip
                              size="sm"
                              color={getStatusColor(sprint.status)}
                              variant="flat"
                              className="capitalize"
                            >
                              {sprint.status}
                            </Chip>
                          </div>
                          {sprint.goal && (
                            <p className="text-gray-600 text-sm mb-2">
                              {sprint.goal}
                            </p>
                          )}
                          {sprint.description && (
                            <p className="text-gray-500 text-sm">
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
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="h-4 w-4" />}
                              onPress={() => handleEditSprint(sprint)}
                            >
                              Edit Sprint
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              startContent={<Trash2 className="h-4 w-4" />}
                              className="text-danger"
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
                            <span className="text-sm font-medium">
                              Progress
                            </span>
                            <span className="text-sm text-gray-500">
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
                          />
                        </div>
                      )}

                      {/* Sprint Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {formatDate(sprint.startDate)} -{" "}
                            {formatDate(sprint.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {sprint.issues.length} issues
                          </span>
                        </div>
                        {sprint.capacity && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {sprint.capacity} SP capacity
                            </span>
                          </div>
                        )}
                        {sprint.velocity && (
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
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
