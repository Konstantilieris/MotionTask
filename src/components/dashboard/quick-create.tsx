"use client";

import React, { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface Project {
  id: string;
  name: string;
  key: string;
}

export function QuickCreate() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [issueType, setIssueType] = useState<string>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [selectedProject, setSelectedProject] = useState<string>("PROJ");
  const [isCreating, setIsCreating] = useState(false);

  // Mock projects - in real app, fetch from API
  const projects: Project[] = [
    { id: "1", name: "Motion Task", key: "PROJ" },
    { id: "2", name: "Website Redesign", key: "WEB" },
    { id: "3", name: "Mobile App", key: "MOB" },
  ];

  const issueTypes = [
    { key: "epic", label: "Epic", icon: "solar:crown-bold", color: "purple" },
    {
      key: "story",
      label: "Story",
      icon: "solar:bookmark-bold",
      color: "green",
    },
    {
      key: "task",
      label: "Task",
      icon: "solar:check-square-bold",
      color: "blue",
    },
    { key: "bug", label: "Bug", icon: "solar:bug-bold", color: "red" },
  ];

  const priorities = [
    { key: "lowest", label: "Lowest", color: "default" as const },
    { key: "low", label: "Low", color: "success" as const },
    { key: "medium", label: "Medium", color: "warning" as const },
    { key: "high", label: "High", color: "danger" as const },
    { key: "highest", label: "Highest", color: "danger" as const },
  ];

  const handleCreateIssue = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      // Mock API call - replace with actual API
      const newIssue = {
        type: issueType,
        title,
        description,
        priority,
        projectKey: selectedProject,
      };

      console.log("Creating issue:", newIssue);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form
      setTitle("");
      setDescription("");
      setIssueType("task");
      setPriority("medium");

      onClose();
    } catch (error) {
      console.error("Failed to create issue:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedIssueType = issueTypes.find((type) => type.key === issueType);
  const selectedPriority = priorities.find((p) => p.key === priority);

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button
            color="primary"
            startContent={
              <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
            }
            className="font-medium"
          >
            Create
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Quick create actions"
          className="w-60"
          itemClasses={{
            base: "gap-4",
          }}
        >
          <DropdownItem
            key="issue"
            startContent={
              <Icon icon="solar:check-square-bold" className="w-5 h-5" />
            }
            description="Create a new issue or task"
            onPress={onOpen}
          >
            New Issue
          </DropdownItem>
          <DropdownItem
            key="project"
            startContent={
              <Icon icon="solar:folder-plus-bold" className="w-5 h-5" />
            }
            description="Start a new project"
          >
            New Project
          </DropdownItem>
          <DropdownItem
            key="sprint"
            startContent={
              <Icon icon="solar:calendar-add-bold" className="w-5 h-5" />
            }
            description="Plan a new sprint"
          >
            New Sprint
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        classNames={{
          base: "bg-neutral-900 border border-neutral-700",
          header: "border-b border-neutral-700",
          body: "py-6",
          footer: "border-t border-neutral-700",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Create New Issue</h2>
            <p className="text-sm text-neutral-400">
              Add a new issue to your project
            </p>
          </ModalHeader>
          <ModalBody className="space-y-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Project
              </label>
              <Select
                selectedKeys={[selectedProject]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedProject(selected);
                }}
                className="w-full"
                classNames={{
                  trigger: "bg-neutral-800 border-neutral-600",
                  value: "text-white",
                }}
              >
                {projects.map((project) => (
                  <SelectItem key={project.key}>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat" color="secondary">
                        {project.key}
                      </Chip>
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Issue Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Issue Type
                </label>
                <Select
                  selectedKeys={[issueType]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setIssueType(selected);
                  }}
                  className="w-full"
                  classNames={{
                    trigger: "bg-neutral-800 border-neutral-600",
                    value: "text-white",
                  }}
                  renderValue={() => (
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          selectedIssueType?.icon || "solar:check-square-bold"
                        }
                        className="w-4 h-4"
                      />
                      <span>{selectedIssueType?.label}</span>
                    </div>
                  )}
                >
                  {issueTypes.map((type) => (
                    <SelectItem key={type.key}>
                      <div className="flex items-center gap-2">
                        <Icon icon={type.icon} className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Priority
                </label>
                <Select
                  selectedKeys={[priority]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setPriority(selected);
                  }}
                  className="w-full"
                  classNames={{
                    trigger: "bg-neutral-800 border-neutral-600",
                    value: "text-white",
                  }}
                  renderValue={() => (
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={selectedPriority?.color}
                        variant="flat"
                      >
                        {selectedPriority?.label}
                      </Chip>
                    </div>
                  )}
                >
                  {priorities.map((p) => (
                    <SelectItem key={p.key}>
                      <Chip size="sm" color={p.color} variant="flat">
                        {p.label}
                      </Chip>
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Title *
              </label>
              <Input
                placeholder="Enter issue title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-neutral-800 border-neutral-600",
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Description
              </label>
              <Textarea
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minRows={3}
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-neutral-800 border-neutral-600",
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateIssue}
              isLoading={isCreating}
              isDisabled={!title.trim()}
            >
              Create Issue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
