"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { useFilterStore } from "@/lib/stores/filter-store";
import { filterIssues } from "@/lib/utils/filter-utils";
import IssueCard from "./issue-card";
import BoardColumn from "./board-column";
import CreateIssueModal from "./create-issue-modal";

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
  archived?: boolean;
  assignee?: {
    name: string;
    email: string;
  };
  reporter: {
    name: string;
    email: string;
  };
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface KanbanBoardProps {
  project: Project;
  issuesByStatus: {
    backlog: Issue[];
    todo: Issue[];
    "in-progress": Issue[];
    done: Issue[];
  };
  userRole: string;
}

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-700" },
  { id: "todo", title: "To Do", color: "bg-blue-700" },
  { id: "in-progress", title: "In Progress", color: "bg-purple-700" },
  { id: "done", title: "Done", color: "bg-green-700" },
];

export default function KanbanBoard({
  project,
  issuesByStatus,
  userRole,
}: KanbanBoardProps) {
  const [issues, setIssues] = useState(issuesByStatus);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const { filters } = useFilterStore();

  // Apply filters to issues
  const filteredIssues = useMemo(() => {
    const result: typeof issues = {
      backlog: [],
      todo: [],
      "in-progress": [],
      done: [],
    };

    Object.keys(issues).forEach((status) => {
      const statusKey = status as keyof typeof issues;
      result[statusKey] = filterIssues(issues[statusKey], filters);
    });

    return result;
  }, [issues, filters]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeIssue = Object.values(issues)
        .flat()
        .find((issue) => issue._id === active.id);

      if (activeIssue) {
        setActiveIssue(activeIssue);
      }
    },
    [issues]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the containers
      const activeContainer = Object.keys(issues).find((key) =>
        issues[key as keyof typeof issues].some(
          (issue) => issue._id === activeId
        )
      );

      const overContainer = Object.keys(issues).find(
        (key) =>
          key === overId ||
          issues[key as keyof typeof issues].some(
            (issue) => issue._id === overId
          )
      );

      if (!activeContainer || !overContainer) return;
      if (activeContainer === overContainer) return;

      setIssues((prev) => {
        const activeItems = prev[activeContainer as keyof typeof prev];
        const overItems = prev[overContainer as keyof typeof prev];

        const activeIndex = activeItems.findIndex(
          (item) => item._id === activeId
        );
        const overIndex = overItems.findIndex((item) => item._id === overId);

        const activeItem = activeItems[activeIndex];

        return {
          ...prev,
          [activeContainer]: activeItems.filter(
            (item) => item._id !== activeId
          ),
          [overContainer]: [
            ...overItems.slice(
              0,
              overIndex >= 0 ? overIndex : overItems.length
            ),
            { ...activeItem, status: overContainer },
            ...overItems.slice(overIndex >= 0 ? overIndex : overItems.length),
          ],
        };
      });
    },
    [issues]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveIssue(null);

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeContainer = Object.keys(issues).find((key) =>
        issues[key as keyof typeof issues].some(
          (issue) => issue._id === activeId
        )
      );

      if (!activeContainer) return;

      const activeItems = issues[activeContainer as keyof typeof issues];
      const activeIndex = activeItems.findIndex(
        (item) => item._id === activeId
      );
      const overIndex = activeItems.findIndex((item) => item._id === overId);

      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        setIssues((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(activeItems, activeIndex, overIndex),
        }));
      }

      // Update the issue in the database
      try {
        const response = await fetch(`/api/issues/${activeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: activeContainer,
            position: overIndex >= 0 ? overIndex : activeItems.length,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update issue");
        }

        toast.success("Issue updated successfully");
      } catch (error) {
        console.error("Failed to update issue position:", error);
        toast.error("Failed to update issue position");
        // Revert the optimistic update
        setIssues(issuesByStatus);
      }
    },
    [issues, issuesByStatus]
  );

  // Issue action handlers
  const handleDeleteIssue = useCallback((issueId: string) => {
    // Remove the issue from local state immediately
    setIssues((prev) => {
      const newIssues = { ...prev };
      Object.keys(newIssues).forEach((status) => {
        const statusKey = status as keyof typeof newIssues;
        newIssues[statusKey] = newIssues[statusKey].filter(
          (issue) => issue._id !== issueId
        );
      });
      return newIssues;
    });
  }, []);

  const handleAssignIssue = useCallback(
    (issueId: string, assigneeId: string | null) => {
      // Update the issue assignment in local state
      setIssues((prev) => {
        const newIssues = { ...prev };
        Object.keys(newIssues).forEach((status) => {
          const statusKey = status as keyof typeof newIssues;
          newIssues[statusKey] = newIssues[statusKey].map((issue) =>
            issue._id === issueId
              ? {
                  ...issue,
                  assignee: assigneeId
                    ? { name: "Loading...", email: assigneeId }
                    : undefined,
                }
              : issue
          );
        });
        return newIssues;
      });
    },
    []
  );

  // Column action handlers
  const handleMoveAllToBacklog = useCallback(
    async (columnId: string) => {
      const columnIssues = issues[columnId as keyof typeof issues] || [];

      if (columnIssues.length === 0) return;

      try {
        // Get the current highest position in backlog to avoid conflicts
        const backlogIssues = issues.backlog || [];
        const maxBacklogPosition =
          backlogIssues.length > 0
            ? Math.max(...backlogIssues.map((issue) => issue.position || 0))
            : -1;

        // Move all issues to backlog status with proper positioning
        const updatePromises = columnIssues.map((issue, index) =>
          fetch(`/api/issues/${issue._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "backlog",
              position: maxBacklogPosition + index + 1, // Append to end of backlog
            }),
          })
        );

        await Promise.all(updatePromises);

        // Update local state - move issues from source column to end of backlog
        setIssues((prev) => ({
          ...prev,
          [columnId]: [], // Clear the source column
          backlog: [
            ...(prev.backlog || []), // Keep existing backlog issues
            ...columnIssues.map((issue, index) => ({
              ...issue,
              status: "backlog",
              position: maxBacklogPosition + index + 1,
            })),
          ],
        }));
      } catch (error) {
        console.error("Failed to move issues to backlog:", error);
        toast.error("Failed to move issues to backlog");
      }
    },
    [issues]
  );

  const handleSortColumn = useCallback(
    (columnId: string, sortBy: "priority" | "title" | "created") => {
      const columnIssues = [...(issues[columnId as keyof typeof issues] || [])];

      columnIssues.sort((a, b) => {
        switch (sortBy) {
          case "priority":
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return (
              (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
              (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
            );
          case "title":
            return a.title.localeCompare(b.title);
          case "created":
            return new Date(b._id).getTime() - new Date(a._id).getTime(); // ObjectId contains timestamp
          default:
            return 0;
        }
      });

      // Update positions
      const updatePromises = columnIssues.map((issue, index) =>
        fetch(`/api/issues/${issue._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            position: index,
          }),
        })
      );

      Promise.all(updatePromises).catch((error) => {
        console.error("Failed to update issue positions:", error);
        toast.error("Failed to update issue positions");
      });

      // Update local state
      setIssues((prev) => ({
        ...prev,
        [columnId]: columnIssues.map((issue, index) => ({
          ...issue,
          position: index,
        })),
      }));
    },
    [issues]
  );

  const handleArchiveCompleted = useCallback(
    async (columnId: string) => {
      if (columnId !== "done") return;

      const completedIssues = issues.done || [];

      if (completedIssues.length === 0) return;

      try {
        // Archive all completed issues (soft delete or status change)
        const updatePromises = completedIssues.map((issue) =>
          fetch(`/api/issues/${issue._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              archived: true,
            }),
          })
        );

        await Promise.all(updatePromises);

        // Update local state
        setIssues((prev) => ({
          ...prev,
          done: [],
        }));
      } catch (error) {
        console.error("Failed to archive completed issues:", error);
        toast.error("Failed to archive completed issues");
      }
    },
    [issues]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full overflow-x-auto overflow-y-hidden p-2 sm:p-4 lg:p-6 w-full gap-3 sm:gap-4 lg:gap-6">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            issues={
              filteredIssues[column.id as keyof typeof filteredIssues] || []
            }
            userRole={userRole}
            projectId={project._id}
            onDeleteIssue={handleDeleteIssue}
            onAssignIssue={handleAssignIssue}
            onMoveAllToBacklog={handleMoveAllToBacklog}
            onSortColumn={handleSortColumn}
            onArchiveCompleted={handleArchiveCompleted}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? <IssueCard issue={activeIssue} isDragging /> : null}
      </DragOverlay>

      <CreateIssueModal />
    </DndContext>
  );
}
