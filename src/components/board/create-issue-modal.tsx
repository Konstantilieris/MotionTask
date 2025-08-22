"use client";

import { useState, useEffect, useCallback } from "react";
import { useModalStore } from "@/lib/stores/modal-store";
import { toast } from "sonner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

export default function CreateIssueModal() {
  const { isOpen, closeModal, getData } = useModalStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("task");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assignee, setAssignee] = useState("");
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [sprint, setSprint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sprints, setSprints] = useState<
    Array<{ _id: string; name: string; status: string }>
  >([]);
  const isModalOpen = isOpen("issue-create");
  const modalData = getData("issue-create") as
    | { status?: string; projectId?: string }
    | undefined;

  useEffect(() => {
    if (isModalOpen && modalData?.status) {
      setStatus(modalData.status as string);
    }
  }, [isModalOpen, modalData]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/users/team");
      if (response.ok) {
        const { users } = await response.json();
        setTeamMembers(users);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }, []);

  const fetchSprints = useCallback(async () => {
    try {
      if (modalData?.projectId) {
        console.log("Fetching sprints for project:", modalData.projectId);
        const response = await fetch(
          `/api/sprints?project=${modalData.projectId}`
        );

        if (response.ok) {
          const sprintData = await response.json();
          console.log("Fetched sprints:", sprintData); // Debug log

          const filteredSprints = sprintData.filter(
            (s: { _id: string; name: string; status: string }) =>
              s.status === "planned" || s.status === "active"
          );

          console.log("Filtered sprints:", filteredSprints); // Debug log
          setSprints(filteredSprints);
        }
      }
    } catch (error) {
      console.error("Error fetching sprints:", error);
    }
  }, [modalData?.projectId]);

  // Fetch team members and sprints when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchTeamMembers();
      fetchSprints();
    }
  }, [isModalOpen, fetchTeamMembers, fetchSprints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Issue title is required");
      return;
    }

    console.log("Modal data:", modalData); // Debug log
    console.log("Project ID from data:", modalData?.projectId); // Debug log

    if (!modalData?.projectId) {
      toast.error("Project ID is missing");
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Creating issue...");

      const requestData = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        status,
        assignee: assignee || null,
        storyPoints: storyPoints > 0 ? storyPoints : undefined,
        sprint: sprint || undefined,
        project: modalData.projectId,
      };

      console.log("Sending issue data:", requestData); // Debug log

      const response = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create issue");
      }

      toast.dismiss();
      toast.success("Issue created successfully!");

      // Close modal first
      closeModal("issue-create");

      // Reset form
      setTitle("");
      setDescription("");
      setType("task");
      setPriority("medium");
      setStatus("todo");
      setAssignee("");
      setStoryPoints(0);
      setSprint("");

      // Force a hard refresh to show the new issue
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 200);
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create issue";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setDescription("");
      setType("task");
      setPriority("medium");
      setStatus("todo");
      setAssignee("");
      setStoryPoints(0);
      setSprint("");
      closeModal("issue-create");
    }
  };

  if (!isModalOpen) return null;

  const typeOptions = [
    { key: "task", label: "Task" },
    { key: "bug", label: "Bug" },
    { key: "story", label: "Story" },
    { key: "epic", label: "Epic" },
  ];

  const priorityOptions = [
    { key: "low", label: "Low" },
    { key: "medium", label: "Medium" },
    { key: "high", label: "High" },
    { key: "critical", label: "Critical" },
  ];

  const statusOptions = [
    { key: "backlog", label: "Backlog" },
    { key: "todo", label: "To Do" },
    { key: "in-progress", label: "In Progress" },
    { key: "done", label: "Done" },
  ];

  const assigneeOptions = [
    { key: "", label: "Unassigned" },
    ...teamMembers.map((member) => ({
      key: member._id,
      label: `${member.name} (${member.email})`,
    })),
  ];

  const sprintOptions = [
    { key: "", label: "No Sprint" },
    ...sprints
      .filter(
        (sprint) => sprint.status === "active" || sprint.status === "planned"
      )
      .map((sprint) => ({
        key: sprint._id,
        label: `${sprint.name} (${sprint.status})`,
      })),
  ];

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      className="dark font-sans"
      placement="top-center"
      size="4xl"
      backdrop="blur"
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1 text-light-100 tracking-wide">
            Create New Issue
          </ModalHeader>
          <ModalBody>
            <Input
              label="Issue Title"
              placeholder="Enter issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              isRequired
              isDisabled={isLoading}
              variant="bordered"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
              }}
            />

            <Textarea
              label="Description"
              placeholder="Enter issue description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              isDisabled={isLoading}
              variant="bordered"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
                innerWrapper: "h-60",
              }}
            />

            <div className="flex gap-4">
              <Select
                label="Type"
                placeholder="Select type"
                selectedKeys={[type]}
                onSelectionChange={(keys) =>
                  setType(Array.from(keys)[0] as string)
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {typeOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Priority"
                placeholder="Select priority"
                selectedKeys={[priority]}
                onSelectionChange={(keys) =>
                  setPriority(Array.from(keys)[0] as string)
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {priorityOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex gap-4">
              <Select
                label="Status"
                placeholder="Select status"
                selectedKeys={[status]}
                onSelectionChange={(keys) =>
                  setStatus(Array.from(keys)[0] as string)
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="Assignee"
                placeholder="Select assignee"
                selectedKeys={assignee ? [assignee] : []}
                onSelectionChange={(keys) =>
                  setAssignee((Array.from(keys)[0] as string) || "")
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {assigneeOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>

              <Input
                label="Story Points"
                placeholder="Enter story points (optional)"
                type="number"
                min="0"
                max="100"
                value={storyPoints.toString()}
                onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  input: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  inputWrapper: "bg-neutral-900 text-white rounded-lg",
                }}
              />

              <Select
                label="Sprint"
                placeholder="Select sprint (optional)"
                selectedKeys={sprint ? [sprint] : []}
                onSelectionChange={(keys) =>
                  setSprint((Array.from(keys)[0] as string) || "")
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {sprintOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="bordered"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="success"
              type="submit"
              variant="bordered"
              isLoading={isLoading}
              isDisabled={!title.trim()}
            >
              {isLoading ? "Creating..." : "Create Issue"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
