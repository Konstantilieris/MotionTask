"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  CheckboxGroup,
  Checkbox,
  Divider,
  Chip,
} from "@heroui/react";
import { Search, X } from "lucide-react";
import { useFilterStore } from "@/lib/stores/filter-store";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAssignees: Array<{ id: string; name: string; email: string }>;
}

const issueTypes = [
  { key: "task", label: "Task" },
  { key: "bug", label: "Bug" },
  { key: "story", label: "Story" },
  { key: "epic", label: "Epic" },
];

const priorities = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

export default function FilterModal({
  isOpen,
  onClose,
  availableAssignees,
}: FilterModalProps) {
  const { filters, setFilter, clearFilters } = useFilterStore();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    Object.entries(localFilters).forEach(([key, value]) => {
      setFilter(key as keyof typeof localFilters, value);
    });
    onClose();
  };

  const handleClearAll = () => {
    const clearedFilters = {
      assignee: [],
      type: [],
      priority: [],
      searchQuery: "",
    };
    setLocalFilters(clearedFilters);
    clearFilters();
  };

  const getActiveFilterCount = () => {
    return (
      localFilters.assignee.length +
      localFilters.type.length +
      localFilters.priority.length +
      (localFilters.searchQuery ? 1 : 0)
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      placement="center"
      className="dark"
      backdrop="blur"
      classNames={{
        base: "mx-2 my-2 sm:mx-4 sm:my-4 max-h-[90vh] bg-gray-900/95 backdrop-blur-md border border-white/10",
        wrapper: "items-center justify-center",
        body: "p-4 sm:p-6 max-h-[75vh] bg-gray-900/50",
        header: "p-4 sm:p-6 pb-2 border-b border-white/10",
        footer: "p-4 sm:p-6 pt-2 border-t border-white/10",
      }}
    >
      <ModalContent className="bg-gray-900/95 backdrop-blur-md">
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-white tracking-wide">
              Filter Issues
            </h2>
            {getActiveFilterCount() > 0 && (
              <Chip
                size="sm"
                color="primary"
                variant="flat"
                className="bg-blue-500/20 text-blue-300 border border-blue-500/30"
              >
                {getActiveFilterCount()} active
              </Chip>
            )}
          </div>
        </ModalHeader>
        <ModalBody className="gap-6">
          {/* Search */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              Search Issues
            </label>
            <Input
              placeholder="Search by title, description, or key..."
              value={localFilters.searchQuery}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              endContent={
                localFilters.searchQuery && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        searchQuery: "",
                      }))
                    }
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )
              }
              variant="bordered"
              classNames={{
                input: "text-white bg-transparent",
                inputWrapper:
                  "bg-white/5 border-white/20 hover:border-white/40 data-[focus=true]:border-blue-400",
              }}
            />
          </div>

          <Divider className="bg-white/10" />

          {/* Assignee Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              Assignee
            </label>
            <CheckboxGroup
              value={localFilters.assignee}
              onChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  assignee: value as string[],
                }))
              }
              className="gap-2"
              classNames={{
                wrapper: "gap-2",
              }}
            >
              <Checkbox
                value="unassigned"
                size="sm"
                classNames={{
                  base: "text-gray-300 hover:text-white",
                  label: "text-gray-300",
                  wrapper: "before:border-white/20 after:bg-blue-500",
                }}
              >
                Unassigned
              </Checkbox>
              {availableAssignees.map((assignee) => (
                <Checkbox
                  key={assignee.id}
                  value={assignee.id}
                  size="sm"
                  classNames={{
                    base: "text-gray-300 hover:text-white",
                    label: "text-gray-300",
                    wrapper: "before:border-white/20 after:bg-blue-500",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{assignee.name}</span>
                    <span className="text-xs text-gray-400">
                      {assignee.email}
                    </span>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="bg-white/10" />

          {/* Issue Type Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              Issue Type
            </label>
            <CheckboxGroup
              value={localFilters.type}
              onChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  type: value as string[],
                }))
              }
              className="gap-2"
            >
              {issueTypes.map((type) => (
                <Checkbox
                  key={type.key}
                  value={type.key}
                  size="sm"
                  classNames={{
                    base: "text-gray-300 hover:text-white",
                    label: "text-gray-300",
                    wrapper: "before:border-white/20 after:bg-blue-500",
                  }}
                >
                  {type.label}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider className="bg-white/10" />

          {/* Priority Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">
              Priority
            </label>
            <CheckboxGroup
              value={localFilters.priority}
              onChange={(value) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  priority: value as string[],
                }))
              }
              className="gap-2"
            >
              {priorities.map((priority) => (
                <Checkbox
                  key={priority.key}
                  value={priority.key}
                  size="sm"
                  classNames={{
                    base: "text-gray-300 hover:text-white",
                    label: "text-gray-300",
                    wrapper: "before:border-white/20 after:bg-blue-500",
                  }}
                >
                  <span className="capitalize text-gray-300">
                    {priority.label}
                  </span>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        </ModalBody>
        <ModalFooter className="gap-3">
          <Button
            variant="light"
            onPress={handleClearAll}
            className="text-gray-400 hover:text-gray-200 hover:bg-white/10"
          >
            Clear All
          </Button>
          <Button
            variant="light"
            onPress={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleApplyFilters}
            variant="bordered"
            className="border-blue-400/30 hover:border-blue-400/60 text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10"
          >
            Apply Filters
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
