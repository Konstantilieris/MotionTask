"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/useDashboardData";

export function MyWork() {
  const { myIssues, isLoading } = useDashboardData();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "highest":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "primary";
      case "low":
        return "success";
      case "lowest":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "epic":
        return "solar:crown-bold";
      case "story":
        return "solar:bookmark-bold";
      case "task":
        return "solar:check-square-bold";
      case "bug":
        return "solar:bug-bold";
      case "subtask":
        return "solar:checklist-bold";
      default:
        return "solar:document-bold";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "to do":
        return "default";
      case "in progress":
        return "primary";
      case "in review":
        return "warning";
      case "done":
        return "success";
      default:
        return "default";
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update issue status");
      }

      // Optimistically update the UI
      console.log("Status updated:", issueId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleLogTime = async (issueId: string) => {
    // Navigate to time logging page or open modal
    console.log("Logging time for:", issueId);
  };

  const sortedIssues = [...myIssues].sort((a, b) => {
    // Sort by: overdue → due soon → in progress → priority
    const aIsOverdue = a.dueDate && new Date(a.dueDate) < new Date();
    const bIsOverdue = b.dueDate && new Date(b.dueDate) < new Date();

    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    if (a.status === "In Progress" && b.status !== "In Progress") return -1;
    if (a.status !== "In Progress" && b.status === "In Progress") return 1;

    const priorityOrder: Record<string, number> = {
      highest: 5,
      high: 4,
      medium: 3,
      low: 2,
      lowest: 1,
    };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Assigned to Me</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-neutral-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Assigned to Me</h3>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="primary">
            {myIssues.length} issues
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            as={Link}
            href="/issues?assignee=me"
          >
            <Icon icon="solar:external-link-bold" className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {sortedIssues.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <Icon
              icon="solar:check-circle-bold"
              className="w-12 h-12 mx-auto mb-2"
            />
            <p>All caught up! No issues assigned to you.</p>
          </div>
        ) : (
          sortedIssues.map((issue) => {
            const daysUntilDue = issue.dueDate
              ? getDaysUntilDue(issue.dueDate)
              : null;
            const isOverdue =
              issue.dueDate && new Date(issue.dueDate) < new Date();

            return (
              <div
                key={issue._id}
                className={`p-3 rounded-lg border transition-colors hover:bg-neutral-800/50 ${
                  isOverdue
                    ? "border-red-500/30 bg-red-950/20"
                    : "border-neutral-700 bg-neutral-800/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Icon
                      icon={getTypeIcon(issue.type)}
                      className={`w-5 h-5 ${
                        issue.type === "bug" ? "text-red-400" : "text-blue-400"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/issues/${issue.key}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors truncate"
                      >
                        {issue.key}
                      </Link>
                      <Chip
                        size="sm"
                        color={getPriorityColor(issue.priority)}
                        variant="flat"
                        className="capitalize"
                      >
                        {issue.priority}
                      </Chip>
                      {isOverdue && (
                        <Chip size="sm" color="danger" variant="flat">
                          Overdue
                        </Chip>
                      )}
                    </div>

                    <p className="text-sm text-neutral-300 mb-2 line-clamp-1">
                      {issue.title}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Chip size="sm" variant="bordered" className="text-xs">
                          {issue.project.key}
                        </Chip>
                        {issue.dueDate && (
                          <span
                            className={
                              daysUntilDue && daysUntilDue < 0
                                ? "text-red-400"
                                : ""
                            }
                          >
                            Due{" "}
                            {daysUntilDue === 0
                              ? "today"
                              : daysUntilDue === 1
                              ? "tomorrow"
                              : daysUntilDue && daysUntilDue < 0
                              ? `${Math.abs(daysUntilDue)} days ago`
                              : `in ${daysUntilDue} days`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Chip
                          size="sm"
                          color={getStatusColor(issue.status)}
                          variant="flat"
                        >
                          {issue.status}
                        </Chip>

                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Icon
                                icon="solar:menu-dots-bold"
                                className="w-4 h-4"
                              />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Issue actions"
                            className="w-48"
                          >
                            <DropdownItem
                              key="todo"
                              startContent={
                                <Icon
                                  icon="solar:clipboard-bold"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() =>
                                handleStatusChange(issue._id, "To Do")
                              }
                            >
                              Mark as To Do
                            </DropdownItem>
                            <DropdownItem
                              key="progress"
                              startContent={
                                <Icon
                                  icon="solar:play-bold"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() =>
                                handleStatusChange(issue._id, "In Progress")
                              }
                            >
                              Start Progress
                            </DropdownItem>
                            <DropdownItem
                              key="review"
                              startContent={
                                <Icon
                                  icon="solar:eye-bold"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() =>
                                handleStatusChange(issue._id, "In Review")
                              }
                            >
                              Move to Review
                            </DropdownItem>
                            <DropdownItem
                              key="done"
                              startContent={
                                <Icon
                                  icon="solar:check-circle-bold"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() =>
                                handleStatusChange(issue._id, "Done")
                              }
                            >
                              Mark as Done
                            </DropdownItem>
                            <DropdownItem
                              key="time"
                              startContent={
                                <Icon
                                  icon="solar:clock-bold"
                                  className="w-4 h-4"
                                />
                              }
                              onPress={() => handleLogTime(issue._id)}
                            >
                              Log Time
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
