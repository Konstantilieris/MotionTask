"use client";

import { memo } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardBody, Chip, Avatar, Badge, Progress } from "@heroui/react";
import {
  Bug,
  CheckCircle2,
  Circle,
  User,
  Calendar,
  GitBranch,
  Hash,
  ExternalLink,
} from "lucide-react";
import { BoardIssue, SwimlaneType } from "@/types/board/types";
import IssueActionsDropdown from "./issue-actions-dropdown";

interface EnhancedIssueCardProps {
  issue: BoardIssue;
  swimlane: SwimlaneType;
  isDragging?: boolean;
  hoveredParentId?: string | null;
  onHoverParent?: (parentId: string | null) => void;
  onIssueUpdate?: () => void;
}

const IssueTypeIcon = memo(({ type }: { type: string }) => {
  switch (type) {
    case "bug":
      return <Bug className="h-4 w-4 text-red-500" />;
    case "story":
      return <Circle className="h-4 w-4 text-green-500" />;
    case "task":
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case "subtask":
      return <GitBranch className="h-4 w-4 text-purple-500" />;
    case "epic":
      return <Hash className="h-4 w-4 text-yellow-500" />;
    default:
      return <Circle className="h-4 w-4 text-neutral-500" />;
  }
});

IssueTypeIcon.displayName = "IssueTypeIcon";

const PriorityChip = memo(({ priority }: { priority: string }) => {
  const colors = {
    critical: "danger",
    high: "warning",
    medium: "primary",
    low: "default",
  } as const;

  return (
    <Chip
      size="sm"
      variant="flat"
      color={colors[priority as keyof typeof colors] || "default"}
    >
      {priority}
    </Chip>
  );
});

PriorityChip.displayName = "PriorityChip";

const SubtaskProgress = memo(
  ({ counts }: { counts: { subtasksDone: number; subtasksTotal: number } }) => {
    const percentage =
      counts.subtasksTotal > 0
        ? (counts.subtasksDone / counts.subtasksTotal) * 100
        : 0;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400">Subtasks</span>
          <span className="text-neutral-300">
            {counts.subtasksDone}/{counts.subtasksTotal}
          </span>
        </div>
        <Progress
          size="sm"
          value={percentage}
          color={percentage === 100 ? "success" : "primary"}
          className="w-full"
        />
      </div>
    );
  }
);

SubtaskProgress.displayName = "SubtaskProgress";

const ParentChip = memo(
  ({
    parent,
    onHover,
  }: {
    parent: { id: string; key: string; summary: string };
    onHover?: (parentId: string | null) => void;
  }) => (
    <Chip
      size="sm"
      variant="bordered"
      startContent={<GitBranch className="h-3 w-3" />}
      className="cursor-pointer hover:bg-neutral-800 border-neutral-700 bg-neutral-900 text-neutral-300 transition-colors"
      onMouseEnter={() => onHover?.(parent.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={(e) => {
        e.stopPropagation();
        // Navigate to parent issue
        window.open(`/issues/${parent.key}`, "_blank");
      }}
    >
      {parent.key}
    </Chip>
  )
);

ParentChip.displayName = "ParentChip";

export const EnhancedIssueCard = memo<EnhancedIssueCardProps>(
  ({
    issue,
    swimlane,
    isDragging = false,
    hoveredParentId,
    onHoverParent,
    onIssueUpdate,
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({
        id: issue.id,
        data: {
          type: "issue",
          issue,
        },
      });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isSubtask = issue.type === "subtask";
    const isParentHovered = hoveredParentId === issue.id;
    const isChildOfHoveredParent = hoveredParentId === issue.parent?.id;

    // Determine card layout based on type
    const cardClasses = `
    cursor-grab active:cursor-grabbing
    transition-all duration-200
    bg-neutral-900 border border-neutral-700 hover:border-neutral-600 hover:shadow-lg
    ${isDragging ? "opacity-60 rotate-3 scale-105" : ""}
    ${isParentHovered ? "ring-2 ring-blue-500 shadow-lg border-blue-500" : ""}
    ${
      isChildOfHoveredParent
        ? "ring-2 ring-purple-500 shadow-lg border-purple-500"
        : ""
    }
    ${isSubtask ? "ml-4 border-l-2 border-purple-500" : ""}
    group
  `;

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cardClasses}
        onMouseEnter={() => {
          if (issue.type !== "subtask" && issue.counts?.subtasksTotal) {
            onHoverParent?.(issue.id);
          }
        }}
        onMouseLeave={() => {
          if (issue.type !== "subtask") {
            onHoverParent?.(null);
          }
        }}
      >
        <CardBody className="p-3 space-y-2 bg-neutral-900">
          {/* Epic color bar for non-subtask issues */}
          {!isSubtask && issue.epic && (
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l bg-blue-500"
              data-epic-color={issue.epic.color || "#3B82F6"}
            />
          )}

          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <IssueTypeIcon type={issue.type} />
              <span className="text-xs font-mono text-neutral-400 shrink-0">
                {issue.key}
              </span>
              {issue.storyPoints && (
                <Chip size="sm" variant="flat" color="secondary">
                  {issue.storyPoints}
                </Chip>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Link to issue page */}
              <Link
                href={`/issues/${issue.key}`}
                className="p-1 hover:bg-neutral-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Open ${issue.key}`}
                aria-label={`Open issue ${issue.key}`}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3 text-neutral-400 hover:text-neutral-200" />
              </Link>

              {/* Issue actions dropdown */}
              <IssueActionsDropdown
                issue={issue}
                onIssueUpdate={onIssueUpdate}
              />
            </div>
          </div>

          {/* Issue title */}
          <Link
            href={`/issues/${issue.key}`}
            className="block"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              className={`font-medium text-sm leading-tight hover:text-blue-400 transition-colors cursor-pointer ${
                isSubtask ? "text-neutral-300" : "text-neutral-100"
              }`}
            >
              {issue.summary}
            </h4>
          </Link>

          {/* Parent chip for subtasks */}
          {isSubtask && issue.parent && swimlane !== "parent" && (
            <ParentChip parent={issue.parent} onHover={onHoverParent} />
          )}

          {/* Epic chip for non-subtasks when not grouped by epic */}
          {!isSubtask && issue.epic && swimlane !== "epic" && (
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Hash className="h-3 w-3" />}
              className="bg-blue-900/50 text-blue-300"
            >
              {issue.epic.name}
            </Chip>
          )}

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.slice(0, 3).map((label) => (
                <Chip
                  key={label}
                  size="sm"
                  variant="flat"
                  className="bg-neutral-800 text-neutral-300"
                >
                  {label}
                </Chip>
              ))}
              {issue.labels.length > 3 && (
                <Chip
                  size="sm"
                  variant="flat"
                  className="bg-neutral-800 text-neutral-300"
                >
                  +{issue.labels.length - 3}
                </Chip>
              )}
            </div>
          )}

          {/* Subtask progress for parent issues */}
          {!isSubtask && issue.counts && issue.counts.subtasksTotal > 0 && (
            <SubtaskProgress
              counts={{
                subtasksDone: issue.counts.subtasksDone,
                subtasksTotal: issue.counts.subtasksTotal,
              }}
            />
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PriorityChip priority={issue.priority} />

              {/* Bug count badge for parent issues */}
              {!isSubtask && issue.counts && issue.counts.openBugs > 0 && (
                <Badge content={issue.counts.openBugs} color="danger" size="sm">
                  <Bug className="h-4 w-4 text-red-500" />
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Due date */}
              {issue.dueDate && (
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(issue.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Assignee */}
              {issue.assignee ? (
                <Avatar
                  size="sm"
                  name={issue.assignee.name}
                  src={issue.assignee.avatar}
                  className="w-6 h-6"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center">
                  <User className="h-3 w-3 text-neutral-400" />
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }
);

EnhancedIssueCard.displayName = "EnhancedIssueCard";

export default EnhancedIssueCard;
