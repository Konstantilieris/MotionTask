"use client";

import { useState } from "react";
import { useModalStore } from "@/lib/stores/modal-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

export default function CreateProjectModal() {
  const { isOpen, closeModal } = useModalStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [priority, setPriority] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);

  const isModalOpen = isOpen("project-create");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Creating project...");

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast.dismiss();
      toast.success("Project created successfully!");

      // Reset form
      setName("");
      setDescription("");
      setStatus("planning");
      setPriority("medium");

      // Close modal
      closeModal("project-create");

      // Refresh the page to show the new project
      router.refresh();
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create project";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setDescription("");
      setStatus("planning");
      setPriority("medium");
      closeModal("project-create");
    }
  };

  if (!isModalOpen) return null;

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

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      className="dark h-[50vh] font-sans"
      size="2xl"
      backdrop="blur"
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            Create New Project
          </ModalHeader>
          <ModalBody>
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
                input: "text-white",
                label: "text-gray-300",
              }}
            />

            <Textarea
              label="Description"
              color="success"
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              isDisabled={isLoading}
              variant="bordered"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
                innerWrapper: "h-80",
              }}
            />

            <div className="flex gap-4">
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
                  label: "text-gray-300",
                  value: "text-white",

                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    color="default"
                    variant="bordered"
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
                  value: "text-white",

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
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="ghost"
              onPress={handleClose}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="success"
              variant="ghost"
              type="submit"
              isLoading={isLoading}
              isDisabled={!name.trim()}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
