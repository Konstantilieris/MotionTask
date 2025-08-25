"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip,
} from "@heroui/react";
import { Calendar, Target, Users, Plus } from "lucide-react";
import { toast } from "sonner";

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sprint?: {
    _id: string;
    name: string;
    description?: string;
    goal?: string;
    startDate: string;
    endDate: string;
    capacity?: number;
    status: string;
  };
  onSprintCreated?: (sprint: Record<string, unknown>) => void;
}

const SprintModal = ({
  isOpen,
  onClose,
  projectId,
  sprint,
  onSprintCreated,
}: SprintModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes or populate when editing
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setGoal("");
      setStartDate("");
      setEndDate("");
      setCapacity("");
    } else if (sprint) {
      // Populate form for editing
      setName(sprint.name);
      setDescription(sprint.description || "");
      setGoal(sprint.goal || "");
      setStartDate(sprint.startDate.split("T")[0]); // Convert to date input format
      setEndDate(sprint.endDate.split("T")[0]);
      setCapacity(sprint.capacity?.toString() || "");
    }
  }, [isOpen, sprint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = sprint ? `/api/sprints/${sprint._id}` : "/api/sprints";
      const method = sprint ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          goal: goal.trim() || undefined,
          startDate,
          endDate,
          project: projectId,
          capacity: capacity ? parseInt(capacity) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to ${sprint ? "update" : "create"} sprint`
        );
      }

      const sprintData = await response.json();
      toast.success(`Sprint ${sprint ? "updated" : "created"} successfully!`);

      if (onSprintCreated) {
        onSprintCreated(sprintData);
      }

      onClose();
    } catch (error) {
      console.error(`Error ${sprint ? "updating" : "creating"} sprint:`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${sprint ? "update" : "create"} sprint`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "mx-2 my-2 sm:mx-4 sm:my-4 max-w-4xl",
        wrapper: "items-start sm:items-center justify-center",
        body: "p-4 sm:p-6 max-h-[80vh]",
        header: "p-4 sm:p-6 pb-2 sm:pb-3",
        footer: "p-4 sm:p-6 pt-2 sm:pt-3",
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {sprint ? "Edit Sprint" : "Create New Sprint"}
              </h2>
            </div>
            <p className="text-sm text-gray-500 font-normal">
              {sprint
                ? "Update your sprint details and settings"
                : "Plan and organize work for your development sprint"}
            </p>
          </ModalHeader>

          <ModalBody className="gap-4">
            {/* Sprint Name */}
            <Input
              label="Sprint Name"
              placeholder="e.g., Sprint 1, User Authentication Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
              startContent={<Target className="h-4 w-4 text-gray-400" />}
            />

            {/* Sprint Goal */}
            <Input
              label="Sprint Goal"
              placeholder="What do you want to achieve in this sprint?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              startContent={<Target className="h-4 w-4 text-gray-400" />}
            />

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Additional details about this sprint..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minRows={2}
              maxRows={4}
            />

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                isRequired
                startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                isRequired
                startContent={<Calendar className="h-4 w-4 text-gray-400" />}
              />
            </div>

            {/* Capacity */}
            <Input
              type="number"
              label="Sprint Capacity (Story Points)"
              placeholder="e.g., 40"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              startContent={<Users className="h-4 w-4 text-gray-400" />}
              description="Estimated story points the team can complete"
            />

            {/* Info Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Chip size="sm" variant="flat" color="primary">
                2-4 week sprints recommended
              </Chip>
              <Chip size="sm" variant="flat" color="secondary">
                Set realistic capacity goals
              </Chip>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
              startContent={!isSubmitting && <Plus className="h-4 w-4" />}
            >
              {isSubmitting
                ? sprint
                  ? "Updating..."
                  : "Creating..."
                : sprint
                ? "Update Sprint"
                : "Create Sprint"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default SprintModal;
