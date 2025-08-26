"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Chip,
} from "@heroui/react";
import {
  IssueFormSchema,
  IssueFormData,
  defaultIssueFormValues,
} from "@/lib/validation/issue";

interface AttachmentFile {
  file: File;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
}

export default function CreateIssueModal() {
  const { isOpen, closeModal, getData } = useModalStore();

  // Form management with react-hook-form and Zod
  const form = useForm({
    resolver: zodResolver(IssueFormSchema),
    defaultValues: defaultIssueFormValues,
    mode: "onChange" as const,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  // Watch form values for conditional logic
  const watchedType = watch("type");
  const watchedLabels = watch("labels");

  // Additional state for UI elements not in the main form
  const [labelInput, setLabelInput] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const isModalOpen = isOpen("issue-create");
  const modalData = getData("issue-create") as
    | { status?: string; projectId?: string }
    | undefined;

  // Field visibility rules based on watched type
  const showStoryPoints = watchedType === "story";

  useEffect(() => {
    if (isModalOpen && modalData?.status) {
      setValue(
        "status",
        modalData.status as "backlog" | "todo" | "in-progress" | "done"
      );
    }
  }, [isModalOpen, modalData, setValue]);

  // Handle label input
  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = labelInput.trim();
      if (
        trimmed &&
        !watchedLabels?.some(
          (l: string) => l.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        setValue("labels", [...(watchedLabels || []), trimmed]);
        setLabelInput("");
      }
    }
  };

  const removeLabel = (index: number) => {
    const newLabels = (watchedLabels || []).filter((_, i) => i !== index);
    setValue("labels", newLabels);
  };

  const resetForm = useCallback(() => {
    reset();
    setAttachments([]);
    setLabelInput("");
  }, [reset]);

  const onSubmit = useCallback(
    async (data: IssueFormData) => {
      if (!modalData?.projectId) {
        toast.error("Project ID is missing");
        return;
      }

      try {
        toast.loading("Creating issue...");

        // Upload attachments first if any
        const uploadedAttachments = [];
        for (const attachment of attachments) {
          const formData = new FormData();
          formData.append("file", attachment.file);
          formData.append("projectId", modalData.projectId);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            uploadedAttachments.push({
              filename: attachment.filename,
              url: uploadData.url,
              mimeType: attachment.mimeType,
              size: attachment.size,
            });
          }
        }

        const requestData = {
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          type: data.type,
          priority: data.priority,
          status: data.status,
          assignee: data.assignee || undefined,
          storyPoints: showStoryPoints ? data.storyPoints : undefined,
          dueDate: data.dueDate || undefined,
          sprint: data.sprint || undefined,
          epic: data.epic || undefined,
          parent: data.parent || undefined,
          labels:
            data.labels && data.labels.length > 0 ? data.labels : undefined,
          timeTracking: data.timeTracking,
          attachments:
            uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
          project: modalData.projectId,
        };

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

        // Close modal and reset form
        closeModal("issue-create");
        resetForm();

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
      }
    },
    [modalData?.projectId, attachments, showStoryPoints, closeModal, resetForm]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      if (isDirty || attachments.length > 0) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to close?"
        );
        if (!confirmed) return;
      }
      resetForm();
      closeModal("issue-create");
    }
  }, [isSubmitting, isDirty, attachments.length, resetForm, closeModal]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isValid) {
          handleSubmit(onSubmit)();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isValid, handleClose, handleSubmit, onSubmit]);

  if (!isModalOpen) return null;

  // Options for selects
  const typeOptions = [
    { key: "task", label: "Task" },
    { key: "bug", label: "Bug" },
    { key: "story", label: "Story" },
    { key: "epic", label: "Epic" },
    { key: "subtask", label: "Subtask" },
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

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      className="dark"
      backdrop="blur"
      classNames={{
        base: "max-h-[95vh] bg-gray-900/95 backdrop-blur-md border border-white/10",
        body: "p-4 sm:p-6",
        header: "p-4 sm:p-6 pb-2 border-b border-white/10",
        footer: "p-4 sm:p-6 pt-2 border-t border-white/10",
      }}
    >
      <ModalContent className="bg-gray-900/95 backdrop-blur-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader className="flex flex-col gap-1 text-white tracking-wide">
            Create New Issue
            {(isDirty || attachments.length > 0) && (
              <span className="text-xs text-orange-400 font-normal">
                • Unsaved changes
              </span>
            )}
          </ModalHeader>
          <ModalBody className="bg-gray-900/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basics */}
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Title Field with Controller */}
                  <Controller
                    name="title"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        label="Title"
                        placeholder="Short, action-oriented summary"
                        value={field.value}
                        onChange={field.onChange}
                        isRequired
                        isDisabled={isSubmitting}
                        variant="bordered"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        classNames={{
                          input: "text-white bg-transparent",
                          label: "text-gray-300",
                          inputWrapper:
                            "bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                        }}
                      />
                    )}
                  />

                  {/* Description Field */}
                  <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Textarea
                        label="Description"
                        placeholder="Detailed description of the issue"
                        value={field.value || ""}
                        onChange={field.onChange}
                        isDisabled={isSubmitting}
                        variant="bordered"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        classNames={{
                          input: "text-white bg-transparent",
                          label: "text-gray-300",
                          inputWrapper:
                            "bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                        }}
                      />
                    )}
                  />

                  {/* Type Selection */}
                  <Controller
                    name="type"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        label="Type"
                        placeholder="Select issue type"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const newType = Array.from(keys)[0] as string;
                          field.onChange(newType);
                        }}
                        isDisabled={isSubmitting}
                        variant="bordered"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        classNames={{
                          trigger:
                            "text-white bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                          label: "text-gray-300",
                          value: "text-white",
                          popoverContent: "bg-gray-800 border-white/20",
                          listboxWrapper: "bg-gray-800",
                        }}
                      >
                        {typeOptions.map((option) => (
                          <SelectItem key={option.key} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Priority Selection */}
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        label="Priority"
                        placeholder="Select priority"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const newPriority = Array.from(keys)[0] as string;
                          field.onChange(newPriority);
                        }}
                        isDisabled={isSubmitting}
                        variant="bordered"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        classNames={{
                          trigger:
                            "text-white bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                          label: "text-gray-300",
                          value: "text-white",
                          popoverContent: "bg-gray-800 border-white/20",
                          listboxWrapper: "bg-gray-800",
                        }}
                      >
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.key} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  {/* Status Selection */}
                  <Controller
                    name="status"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        label="Status"
                        placeholder="Select status"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const newStatus = Array.from(keys)[0] as string;
                          field.onChange(newStatus);
                        }}
                        isDisabled={isSubmitting}
                        variant="bordered"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        classNames={{
                          trigger:
                            "text-white bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                          label: "text-gray-300",
                          value: "text-white",
                          popoverContent: "bg-gray-800 border-white/20",
                          listboxWrapper: "bg-gray-800",
                        }}
                      >
                        {statusOptions.map((option) => (
                          <SelectItem key={option.key} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />

                  {/* Labels */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">
                      Labels
                    </label>
                    <Input
                      placeholder="Type label and press Enter"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={handleLabelKeyDown}
                      isDisabled={isSubmitting}
                      variant="bordered"
                      classNames={{
                        input: "text-white bg-transparent",
                        inputWrapper:
                          "bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
                      }}
                    />
                    {watchedLabels && watchedLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedLabels.map((label: string, index: number) => (
                          <Chip
                            key={index}
                            color="primary"
                            variant="flat"
                            onClose={() => removeLabel(index)}
                            className="bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          >
                            {label}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="flex justify-between bg-gray-900/50">
            <Button
              color="danger"
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting}
              className="border-red-400/30 hover:border-red-400/60 text-red-400 hover:text-red-300"
            >
              Cancel
            </Button>
            <Button
              color="success"
              type="submit"
              variant="bordered"
              isLoading={isSubmitting}
              isDisabled={!isValid}
              className="border-green-400/30 hover:border-green-400/60 text-green-400 hover:text-green-300 bg-green-400/5 hover:bg-green-400/10"
            >
              {isSubmitting ? "Creating..." : "Create Issue"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
