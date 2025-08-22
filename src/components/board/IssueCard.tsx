"use client";

import Link from "next/link";
import { Badge } from "@heroui/react";

interface IssueCardProps {
  issue: {
    _id: string;
    key: string;
    title: string;
    status: string;
    type: string;
    priority: string;
    assignee?: string;
  };
}

const statusColors = {
  todo: "default",
  "in-progress": "primary",
  "in-review": "warning",
  done: "success",
  backlog: "default",
} as const;

const typeColors = {
  task: "primary",
  bug: "danger",
  story: "success",
  epic: "secondary",
} as const;

const priorityColors = {
  low: "default",
  medium: "primary",
  high: "warning",
  critical: "danger",
} as const;

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link
      href={`/issues/${issue.key}`}
      aria-label={`${issue.key} ${issue.title}`}
      className="block"
    >
      <div className="rounded-xl border p-3 hover:shadow-md transition-shadow bg-white cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">{issue.key}</div>
          <Badge
            size="sm"
            color={
              statusColors[issue.status as keyof typeof statusColors] ||
              "default"
            }
          >
            {issue.status}
          </Badge>
        </div>

        <div className="font-medium text-sm mb-3 line-clamp-2">
          {issue.title}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              size="sm"
              variant="flat"
              color={
                typeColors[issue.type as keyof typeof typeColors] || "default"
              }
            >
              {issue.type}
            </Badge>
            <Badge
              size="sm"
              variant="flat"
              color={
                priorityColors[issue.priority as keyof typeof priorityColors] ||
                "default"
              }
            >
              {issue.priority}
            </Badge>
          </div>

          {issue.assignee && (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {issue.assignee.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
