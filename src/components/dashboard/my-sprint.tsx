"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Progress,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/useDashboardData";

export function MySprintOverview() {
  const { activeSprints, myIssues, isLoading } = useDashboardData();

  // Get the current active sprint (assume first one)
  const currentSprint = activeSprints[0];

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">My Sprint</h3>
        </CardHeader>
        <CardBody>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
            <div className="h-2 bg-neutral-800 rounded"></div>
            <div className="h-16 bg-neutral-800 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!currentSprint) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold">My Sprint</h3>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            as={Link}
            href="/sprints"
          >
            Create Sprint
          </Button>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-neutral-400">
            <Icon
              icon="solar:calendar-add-bold"
              className="w-12 h-12 mx-auto mb-2"
            />
            <p>No active sprint found.</p>
            <p className="text-sm mt-1">
              Create a sprint to start tracking progress.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calculate sprint progress from issues
  const sprintIssues = myIssues.filter(
    () =>
      // For now, include all issues since sprint relationship might not be set up yet
      true
  );
  const completedIssues = sprintIssues.filter(
    (issue) => issue.status === "Done" || issue.status === "Completed"
  );
  const issueProgress =
    sprintIssues.length > 0
      ? (completedIssues.length / sprintIssues.length) * 100
      : 0;

  // Calculate days remaining
  const endDate = new Date(currentSprint.endDate);
  const today = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Get next priority issues
  const nextIssues = sprintIssues
    .filter((issue) => issue.status !== "Done" && issue.status !== "Completed")
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        highest: 5,
        high: 4,
        medium: 3,
        low: 2,
        lowest: 1,
      };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3);

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
        return "solar:list-check-bold";
      default:
        return "solar:circle-bold";
    }
  };

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentSprint.name}</h3>
          <p className="text-sm text-neutral-400">
            {daysRemaining} days remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" color="primary" variant="flat">
            Active
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            as={Link}
            href={`/sprints/${currentSprint._id}`}
          >
            <Icon icon="solar:external-link-bold" className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sprint Progress</span>
            <span className="text-sm text-neutral-400">
              {completedIssues.length}/{sprintIssues.length} issues completed
            </span>
          </div>
          <Progress
            value={issueProgress}
            color={
              issueProgress >= 70
                ? "success"
                : issueProgress >= 40
                ? "warning"
                : "danger"
            }
            className="max-w-full"
          />
          <div className="text-xs text-neutral-400">
            {issueProgress.toFixed(0)}% complete
          </div>
        </div>

        {/* Sprint Overview Stats */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-neutral-700">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {sprintIssues.length}
            </div>
            <div className="text-xs text-neutral-400">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400">
              {completedIssues.length}
            </div>
            <div className="text-xs text-neutral-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400">
              {daysRemaining}
            </div>
            <div className="text-xs text-neutral-400">Days Left</div>
          </div>
        </div>

        {/* Next Priority Issues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Next Priority</h4>
            <Button
              size="sm"
              variant="light"
              as={Link}
              href="/issues?sprint=current"
            >
              View All
            </Button>
          </div>

          {nextIssues.length === 0 ? (
            <div className="text-center py-4 text-neutral-400">
              <Icon
                icon="solar:check-circle-bold"
                className="w-8 h-8 mx-auto mb-1"
              />
              <p className="text-sm">All sprint issues completed!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nextIssues.map((issue) => (
                <div
                  key={issue._id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
                >
                  <Icon
                    icon={getTypeIcon(issue.type)}
                    className={`w-4 h-4 flex-shrink-0 ${
                      issue.type === "bug" ? "text-red-400" : "text-blue-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/issues/${issue.key}`}
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors block truncate"
                    >
                      {issue.key}
                    </Link>
                    <p className="text-xs text-neutral-400 truncate">
                      {issue.title}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    color={getPriorityColor(issue.priority)}
                    variant="flat"
                    className="capitalize flex-shrink-0"
                  >
                    {issue.priority}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
