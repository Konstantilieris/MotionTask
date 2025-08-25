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
      size="full"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "mx-2 my-2 sm:mx-4 sm:my-4 max-w-3xl",
        wrapper: "items-start sm:items-center justify-center",
        body: "p-4 sm:p-6 max-h-[80vh]",
        header: "p-4 sm:p-6 pb-2 sm:pb-3",
        footer: "p-4 sm:p-6 pt-2 sm:pt-3",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold">Filter Issues</h2>
            {getActiveFilterCount() > 0 && (
              <Chip size="sm" color="primary" variant="flat">
                {getActiveFilterCount()} active
              </Chip>
            )}
          </div>
        </ModalHeader>
        <ModalBody className="gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
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
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )
              }
            />
          </div>

          <Divider />

          {/* Assignee Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
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
            >
              <Checkbox value="unassigned" size="sm">
                Unassigned
              </Checkbox>
              {availableAssignees.map((assignee) => (
                <Checkbox key={assignee.id} value={assignee.id} size="sm">
                  <div className="flex items-center gap-2">
                    <span>{assignee.name}</span>
                    <span className="text-xs text-gray-500">
                      {assignee.email}
                    </span>
                  </div>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider />

          {/* Issue Type Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
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
                <Checkbox key={type.key} value={type.key} size="sm">
                  {type.label}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>

          <Divider />

          {/* Priority Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
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
                <Checkbox key={priority.key} value={priority.key} size="sm">
                  <span className="capitalize">{priority.label}</span>
                </Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="light" onPress={handleClearAll}>
            Clear All
          </Button>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleApplyFilters}>
            Apply Filters
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
