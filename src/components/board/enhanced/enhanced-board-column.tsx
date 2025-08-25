"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { Plus } from "lucide-react";
import { ColumnState, SwimlaneType } from "@/types/board/types";
import { useModalStore } from "@/lib/stores/modal-store";
import EnhancedIssueCard from "./enhanced-issue-card";
import SwimlaneGroupHeader from "./swimlane-group-header";

interface EnhancedBoardColumnProps {
  column: ColumnState;
  columnIndex: number; // Add column index for color mapping
  swimlane: SwimlaneType;
  hoveredParentId?: string | null;
  onHoverParent?: (parentId: string | null) => void;
  projectId?: string; // Add project ID for issue creation
  onIssueUpdate?: () => void;
}

// Function to get column-specific colors
const getColumnColors = (columnId: string, columnIndex: number) => {
  const colorMap: Record<
    string,
    { dot: string; badge: string; badgeText: string }
  > = {
    todo: {
      dot: "bg-gray-500",
      badge: "bg-gray-600",
      badgeText: "text-gray-200",
    },
    backlog: {
      dot: "bg-gray-500",
      badge: "bg-gray-600",
      badgeText: "text-gray-200",
    },
    "in-progress": {
      dot: "bg-blue-500",
      badge: "bg-blue-600",
      badgeText: "text-blue-100",
    },
    in_progress: {
      dot: "bg-blue-500",
      badge: "bg-blue-600",
      badgeText: "text-blue-100",
    },
    inprogress: {
      dot: "bg-blue-500",
      badge: "bg-blue-600",
      badgeText: "text-blue-100",
    },
    testing: {
      dot: "bg-yellow-500",
      badge: "bg-yellow-600",
      badgeText: "text-yellow-100",
    },
    review: {
      dot: "bg-purple-500",
      badge: "bg-purple-600",
      badgeText: "text-purple-100",
    },
    done: {
      dot: "bg-green-500",
      badge: "bg-green-600",
      badgeText: "text-green-100",
    },
    completed: {
      dot: "bg-green-500",
      badge: "bg-green-600",
      badgeText: "text-green-100",
    },
  };

  // Try to find by exact column ID match first
  const lowerColumnId = columnId.toLowerCase().replace(/[^a-z]/g, "");
  const matchedColor = colorMap[lowerColumnId];

  if (matchedColor) {
    return matchedColor;
  }

  // Fallback to index-based colors
  const fallbackColors = [
    { dot: "bg-gray-500", badge: "bg-gray-600", badgeText: "text-gray-200" },
    { dot: "bg-blue-500", badge: "bg-blue-600", badgeText: "text-blue-100" },
    {
      dot: "bg-yellow-500",
      badge: "bg-yellow-600",
      badgeText: "text-yellow-100",
    },
    { dot: "bg-green-500", badge: "bg-green-600", badgeText: "text-green-100" },
    {
      dot: "bg-purple-500",
      badge: "bg-purple-600",
      badgeText: "text-purple-100",
    },
    { dot: "bg-red-500", badge: "bg-red-600", badgeText: "text-red-100" },
  ];

  return fallbackColors[columnIndex % fallbackColors.length];
};

export const EnhancedBoardColumn = memo<EnhancedBoardColumnProps>(
  ({
    column,
    columnIndex,
    swimlane,
    hoveredParentId,
    onHoverParent,
    projectId,
    onIssueUpdate,
  }) => {
    const { openModal } = useModalStore();
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
      data: {
        type: "column",
        column,
      },
    });

    const issues = column.items.filter((item) => item.kind === "issue");
    const issueIds = issues.map((item) => item.issue.id);
    const issueCount = issues.length;

    // Get column-specific colors
    const colors = getColumnColors(column.id, columnIndex);

    return (
      <Card
        className={`h-full min-h-[600px] transition-colors bg-neutral-700 border-neutral-600 ${
          isOver ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <CardHeader className="pb-2 bg-neutral-700">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
              <h3 className="font-semibold text-neutral-100">{column.name}</h3>
              <Chip size="md" className={`${colors.badge} ${colors.badgeText}`}>
                {issueCount}
              </Chip>
            </div>

            <button
              className="p-2 hover:bg-neutral-600 rounded transition-colors"
              title={`Add issue to ${column.name}`}
              aria-label={`Add issue to ${column.name}`}
              onClick={() => {
                openModal("issue-create", {
                  status: column.id,
                  projectId: projectId,
                });
              }}
            >
              <Plus className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        </CardHeader>

        <CardBody className="pt-2 space-y-2 bg-neutral-800">
          <div ref={setNodeRef} className="min-h-full">
            <SortableContext
              items={issueIds}
              strategy={verticalListSortingStrategy}
            >
              {column.items.map((item) => {
                if (item.kind === "groupHeader") {
                  return (
                    <SwimlaneGroupHeader
                      key={`group-${item.groupKey}`}
                      group={item}
                      swimlane={swimlane}
                    />
                  );
                }

                return (
                  <EnhancedIssueCard
                    key={item.issue.id}
                    issue={item.issue}
                    swimlane={swimlane}
                    hoveredParentId={hoveredParentId}
                    onHoverParent={onHoverParent}
                    onIssueUpdate={onIssueUpdate}
                  />
                );
              })}
            </SortableContext>

            {/* Empty state */}
            {column.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                <div className="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-neutral-300" />
                </div>
                <p className="text-sm text-center">
                  Drop issues here or
                  <br />
                  <button
                    className="text-blue-400 hover:text-blue-300 underline"
                    onClick={() => {
                      openModal("issue-create", {
                        status: column.id,
                        projectId: projectId,
                      });
                    }}
                  >
                    create new issue
                  </button>
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }
);

EnhancedBoardColumn.displayName = "EnhancedBoardColumn";

export default EnhancedBoardColumn;
