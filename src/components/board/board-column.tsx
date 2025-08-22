"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  Archive,
  MoveLeft,
  Settings,
} from "lucide-react";
import {
  Button,
  Chip,
  cn,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { useModalStore } from "@/lib/stores/modal-store";
import IssueCard from "./issue-card";
import { toast } from "sonner";

interface Issue {
  _id: string;
  title: string;
  key: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
  position: number;
  storyPoints?: number;
  assignee?: {
    name: string;
    email: string;
  };
  reporter: {
    name: string;
    email: string;
  };
}

interface BoardColumnProps {
  id: string;
  title: string;
  issues: Issue[];
  userRole: string;
  color?: string; // Optional color prop for custom styling
  projectId: string; // Add project ID prop
  onDeleteIssue?: (issueId: string) => void;
  onAssignIssue?: (issueId: string, assigneeId: string | null) => void;
  onMoveAllToBacklog?: (columnId: string) => void;
  onSortColumn?: (
    columnId: string,
    sortBy: "priority" | "title" | "created"
  ) => void;
  onArchiveCompleted?: (columnId: string) => void;
}

export default function BoardColumn({
  id,
  title,
  issues,
  userRole,
  color = "bg-gray-100", // Default color if not provided
  projectId, // Add project ID parameter
  onDeleteIssue,
  onAssignIssue,
  onMoveAllToBacklog,
  onSortColumn,
  onArchiveCompleted,
}: BoardColumnProps) {
  const { openModal } = useModalStore();
  const { setNodeRef } = useDroppable({
    id,
  });

  const getDropdownItems = () => {
    const items = [];

    // Move to backlog option
    if (userRole !== "viewer" && issues.length > 0) {
      items.push(
        <DropdownItem
          key="move-to-backlog"
          startContent={<MoveLeft className="h-4 w-4" />}
        >
          Move all to backlog
        </DropdownItem>
      );
    }

    // Sorting options
    if (issues.length > 1) {
      items.push(
        <DropdownItem
          key="sort-priority"
          startContent={<ArrowUpDown className="h-4 w-4" />}
        >
          Sort by priority
        </DropdownItem>,
        <DropdownItem
          key="sort-title"
          startContent={<ArrowUpDown className="h-4 w-4" />}
        >
          Sort by title
        </DropdownItem>,
        <DropdownItem
          key="sort-created"
          startContent={<ArrowUpDown className="h-4 w-4" />}
        >
          Sort by date
        </DropdownItem>
      );
    }

    // Archive completed option (only for done column)
    if (id === "done" && issues.length > 0 && userRole !== "viewer") {
      items.push(
        <DropdownItem
          key="archive-completed"
          startContent={<Archive className="h-4 w-4" />}
          className="text-warning"
          color="warning"
        >
          Archive completed
        </DropdownItem>
      );
    }

    // Column settings (always available)
    items.push(
      <DropdownItem
        key="column-settings"
        startContent={<Settings className="h-4 w-4" />}
      >
        Column settings
      </DropdownItem>
    );

    return items;
  };

  const handleColumnAction = (action: string) => {
    switch (action) {
      case "move-to-backlog":
        if (onMoveAllToBacklog && issues.length > 0) {
          onMoveAllToBacklog(id);
          toast.success(`Moved all issues from ${title} to backlog`);
        }
        break;
      case "sort-priority":
        if (onSortColumn) {
          onSortColumn(id, "priority");
          toast.success(`Sorted ${title} by priority`);
        }
        break;
      case "sort-title":
        if (onSortColumn) {
          onSortColumn(id, "title");
          toast.success(`Sorted ${title} by title`);
        }
        break;
      case "sort-created":
        if (onSortColumn) {
          onSortColumn(id, "created");
          toast.success(`Sorted ${title} by creation date`);
        }
        break;
      case "archive-completed":
        if (onArchiveCompleted && id === "done") {
          onArchiveCompleted(id);
          toast.success("Archived completed issues");
        }
        break;
      case "column-settings":
        toast.info("Column settings coming soon!");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col min-w-[260px] w-[280px] sm:min-w-[300px] sm:w-[320px] md:w-[340px] lg:w-[360px] xl:w-[380px] 2xl:w-[400px] flex-shrink-0 bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl h-full">
      {/* Column Header */}
      <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <h3 className="font-medium text-gray-200 text-xs sm:text-sm uppercase tracking-wider truncate">
              {title}
            </h3>
            <Chip
              size="sm"
              variant="flat"
              className={cn(
                "text-gray-300 text-xs min-w-5 h-4 sm:min-w-6 sm:h-5",
                `${color}`
              )}
            >
              {issues.length}
            </Chip>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {userRole !== "viewer" && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() =>
                  openModal("issue-create", { status: id, projectId })
                }
                className="text-gray-400 hover:text-gray-200 w-5 h-5 min-w-5 sm:w-6 sm:h-6 sm:min-w-6"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Button>
            )}

            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-400 hover:text-gray-200 w-5 h-5 min-w-5 sm:w-6 sm:h-6 sm:min-w-6"
                >
                  <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Column actions"
                onAction={(key) => handleColumnAction(key as string)}
              >
                {getDropdownItems()}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 sm:p-3 space-y-2 overflow-y-auto scrollbar-hide min-h-0"
      >
        <SortableContext
          items={issues.map((issue) => issue._id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              onDelete={onDeleteIssue}
              onAssign={onAssignIssue}
            />
          ))}
        </SortableContext>

        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center mb-2 sm:mb-3">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </div>
            <p className="text-gray-500 text-xs font-medium">
              No issues in {title.toLowerCase()}
            </p>
            {userRole !== "viewer" && (
              <p className="text-gray-600 text-xs mt-1">
                Click + to add an issue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
