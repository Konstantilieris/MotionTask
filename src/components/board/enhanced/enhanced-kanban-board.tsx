"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { Select, SelectItem, Chip } from "@heroui/react";
import { Layers3, User, GitBranch, Grid3X3, Loader2 } from "lucide-react";
import {
  BoardPayload,
  BoardIssue,
  ColumnState,
  SwimlaneType,
} from "@/types/board/types";
import EnhancedIssueCard from "./enhanced-issue-card";
import EnhancedBoardColumn from "./enhanced-board-column";
import CreateIssueModal from "../create-issue-modal";

interface EnhancedKanbanBoardProps {
  projectKey: string;
  initialData?: BoardPayload;
}

export default function EnhancedKanbanBoard({
  projectKey,
  initialData,
}: EnhancedKanbanBoardProps) {
  const [boardData, setBoardData] = useState<BoardPayload | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(!initialData);
  const [activeIssue, setActiveIssue] = useState<BoardIssue | null>(null);
  const [swimlane, setSwimlane] = useState<SwimlaneType>("none");
  const [hoveredParentId, setHoveredParentId] = useState<string | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load board data
  const loadBoardData = useCallback(
    async (newSwimlane?: SwimlaneType) => {
      try {
        setLoading(true);
        const currentSwimlane = newSwimlane || swimlane;
        const response = await fetch(
          `/api/projects/${projectKey}/board?swimlane=${currentSwimlane}`
        );
        console.log("RESPONSE &&&&", response);
        if (!response.ok) throw new Error("Failed to load board data");

        const data: BoardPayload = await response.json();
        setBoardData(data);

        if (newSwimlane) {
          setSwimlane(newSwimlane);
        }
      } catch (error) {
        console.error("Error loading board data:", error);
        // toast.error('Failed to load board data');
      } finally {
        setLoading(false);
      }
    },
    [projectKey, swimlane]
  );

  // Load initial data
  useEffect(() => {
    if (!initialData) {
      loadBoardData();
    }
  }, [loadBoardData, initialData]);

  // Listen for issue creation success to refresh board
  useEffect(() => {
    const handleStorageChange = () => {
      // Check if an issue was recently created
      const lastCreated = localStorage.getItem("lastIssueCreated");
      if (lastCreated) {
        const timestamp = parseInt(lastCreated);
        // If created within last 5 seconds, refresh
        if (Date.now() - timestamp < 5000) {
          loadBoardData();
          localStorage.removeItem("lastIssueCreated");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [loadBoardData]);

  // Compute column states based on swimlane grouping
  const columnStates: ColumnState[] = useMemo(() => {
    if (!boardData) return [];

    return boardData.columns.map((column) => {
      const columnIssues = boardData.issues.filter(
        (issue) => issue.status === column.id
      );
      const items: ColumnState["items"] = [];

      if (boardData.swimlane === "none") {
        // Flat view - just add all issues
        columnIssues
          .sort((a, b) => a.rank.localeCompare(b.rank))
          .forEach((issue) => {
            items.push({ kind: "issue", issue });
          });
      } else if (boardData.groups) {
        // Grouped view - organize by swimlane groups
        boardData.groups.forEach((group) => {
          const groupIssues = columnIssues.filter((issue) =>
            group.issueIds.includes(issue.id)
          );

          if (groupIssues.length > 0) {
            // Add group header
            items.push({
              kind: "groupHeader",
              groupKey: group.key,
              title: group.title,
              color: group.color,
            });

            // Add group issues
            groupIssues
              .sort((a, b) => a.rank.localeCompare(b.rank))
              .forEach((issue) => {
                items.push({ kind: "issue", issue });
              });
          }
        });
      }

      return {
        id: column.id,
        name: column.name,
        color: column.color,
        items,
      };
    });
  }, [boardData]);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const issue = boardData?.issues.find((issue) => issue.id === active.id);
      if (issue) {
        setActiveIssue(issue);
      }
    },
    [boardData]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveIssue(null);

      if (!over || !boardData) return;

      const activeIssue = boardData.issues.find(
        (issue) => issue.id === active.id
      );
      if (!activeIssue) return;

      const overId = over.id as string;

      // Check if dropped on a column
      const targetColumn = boardData.columns.find((col) => col.id === overId);
      if (targetColumn && targetColumn.id !== activeIssue.status) {
        // Move to different column - inline implementation to avoid dependency issues
        try {
          const response = await fetch("/api/issues/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issueKey: activeIssue.id,
              toColumn: targetColumn.id,
            }),
          });

          if (!response.ok) throw new Error("Failed to move issue");

          // Optimistic update
          setBoardData((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              issues: prev.issues.map((issue) =>
                issue.id === activeIssue.id
                  ? { ...issue, status: targetColumn.id }
                  : issue
              ),
            };
          });
        } catch (error) {
          console.error("Error moving issue:", error);
          loadBoardData();
        }
        return;
      }

      // Check if dropped on another issue (for reordering)
      const targetIssue = boardData.issues.find((issue) => issue.id === overId);
      if (targetIssue && targetIssue.status === activeIssue.status) {
        try {
          const response = await fetch("/api/issues/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issueKey: activeIssue.id,
              column: activeIssue.status,
              afterKey: targetIssue.id,
            }),
          });

          if (!response.ok) throw new Error("Failed to reorder issue");
          loadBoardData();
        } catch (error) {
          console.error("Error reordering issue:", error);
        }
        return;
      }

      // Check if dropped on parent for reparenting
      if (
        targetIssue &&
        activeIssue.type === "subtask" &&
        targetIssue.type !== "subtask"
      ) {
        try {
          const response = await fetch(
            `/api/issues/${activeIssue.id}/reparent`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                newParentKey: targetIssue.id,
              }),
            }
          );

          if (!response.ok) throw new Error("Failed to reparent issue");
          loadBoardData();
        } catch (error) {
          console.error("Error reparenting issue:", error);
        }
        return;
      }
    },
    [boardData, loadBoardData]
  );

  // Handle swimlane change
  const handleSwimlaneChange = useCallback(
    (newSwimlane: SwimlaneType) => {
      loadBoardData(newSwimlane);
    },
    [loadBoardData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <span className="ml-2 text-neutral-400">Loading board...</span>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-neutral-400">Failed to load board data</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-dark-100 min-h-screen p-4">
      {/* Swimlane Toggle */}
      <div className="flex items-center gap-4 p-4 bg-neutral-900 rounded-lg">
        <span className="text-sm font-medium text-neutral-300">Group by:</span>
        <Select
          size="sm"
          selectedKeys={[swimlane]}
          onSelectionChange={(keys) => {
            const newSwimlane = Array.from(keys)[0] as SwimlaneType;
            handleSwimlaneChange(newSwimlane);
          }}
          color="secondary"
          variant="bordered"
          className="w-40 select-force-white-text"
          classNames={{
            trigger:
              "text-white bg-purple-900 border-purple-700 data-[hover=true]:bg-purple-800 data-[focus=true]:bg-purple-800 [&[data-has-value=true]]:text-white [&[data-has-value=true]]:bg-purple-900",
            value: "text-white [&[data-has-value=true]]:text-white !text-white",
            popoverContent: "bg-neutral-800 border-neutral-700",
            listbox: "bg-neutral-800",
          }}
          style={{
            // Override with inline styles for maximum specificity
            color: "white",
          }}
        >
          <SelectItem
            key="none"
            startContent={<Grid3X3 className="h-4 w-4" />}
            classNames={{
              base: "text-white data-[hover=true]:bg-purple-600",
            }}
          >
            None
          </SelectItem>
          <SelectItem
            key="epic"
            startContent={<Layers3 className="h-4 w-4" />}
            classNames={{
              base: "text-white data-[hover=true]:bg-purple-600",
            }}
          >
            Epic
          </SelectItem>
          <SelectItem
            key="parent"
            startContent={<GitBranch className="h-4 w-4" />}
            classNames={{
              base: "text-white data-[hover=true]:bg-purple-600",
            }}
          >
            Parent
          </SelectItem>
          <SelectItem
            key="assignee"
            startContent={<User className="h-4 w-4" />}
            classNames={{
              base: "text-white data-[hover=true]:bg-purple-600",
            }}
          >
            Assignee
          </SelectItem>
        </Select>

        {/* Show active grouping indicator */}
        {swimlane !== "none" && (
          <Chip size="sm" variant="flat" color="primary">
            Grouped by {swimlane}
          </Chip>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {columnStates.map((column, index) => (
            <EnhancedBoardColumn
              key={column.id}
              column={column}
              columnIndex={index}
              swimlane={swimlane}
              hoveredParentId={hoveredParentId}
              onHoverParent={setHoveredParentId}
              projectKey={projectKey}
              onIssueUpdate={loadBoardData}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue ? (
            <EnhancedIssueCard
              issue={activeIssue}
              swimlane={swimlane}
              isDragging
              onIssueUpdate={loadBoardData}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <CreateIssueModal />
    </div>
  );
}
