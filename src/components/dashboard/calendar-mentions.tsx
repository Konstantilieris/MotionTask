"use client";

import React from "react";
import { Card, CardHeader, CardBody, Chip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useDashboardData } from "@/hooks/useDashboardData";

export function DueSoonOverdue() {
  const { myIssues, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Due Soon & Overdue</h3>
        </CardHeader>
        <CardBody>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calculate due and overdue issues
  const today = new Date();
  const dueSoonIssues = myIssues.filter((issue) => {
    if (!issue.dueDate) return false;
    const dueDate = new Date(issue.dueDate);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 7; // Due within 7 days
  });

  const overdueIssues = myIssues.filter((issue) => {
    if (!issue.dueDate) return false;
    const dueDate = new Date(issue.dueDate);
    return dueDate < today;
  });

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

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const diffDays = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const allDueIssues = [...overdueIssues, ...dueSoonIssues]
    .sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Due Soon & Overdue</h3>
        <div className="flex items-center gap-2">
          {overdueIssues.length > 0 && (
            <Chip size="sm" color="danger" variant="flat">
              {overdueIssues.length} overdue
            </Chip>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            as={Link}
            href="/issues?filter=due-soon"
          >
            <Icon icon="solar:external-link-bold" className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {allDueIssues.length === 0 ? (
          <div className="text-center py-6 text-neutral-400">
            <Icon
              icon="solar:calendar-check-bold"
              className="w-10 h-10 mx-auto mb-2"
            />
            <p>No upcoming due dates</p>
          </div>
        ) : (
          allDueIssues.map((issue) => {
            const isOverdue = new Date(issue.dueDate!) < today;

            return (
              <div
                key={issue._id}
                className={`p-3 rounded-lg border transition-colors hover:bg-neutral-800/50 ${
                  isOverdue
                    ? "border-red-500/30 bg-red-950/20"
                    : "border-neutral-700 bg-neutral-800/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/issues/${issue.key}`}
                      className="font-medium text-white hover:text-blue-400 transition-colors block truncate"
                    >
                      {issue.key}
                    </Link>
                    <p className="text-sm text-neutral-300 truncate mb-2">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={getPriorityColor(issue.priority)}
                        variant="flat"
                        className="capitalize"
                      >
                        {issue.priority}
                      </Chip>
                      <span
                        className={`text-xs ${
                          isOverdue ? "text-red-400" : "text-yellow-400"
                        }`}
                      >
                        {formatDueDate(issue.dueDate!)}
                      </span>
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

export function MentionsAndReviews() {
  const { myIssues, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Mentions & Reviews</h3>
        </CardHeader>
        <CardBody>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  // Filter issues that need review or have mentions
  const reviewIssues = myIssues.filter(
    (issue) => issue.status === "In Review" || issue.status === "Review"
  );

  // Mock mentions data since we don't have a mentions API yet
  const mockMentions = [
    {
      id: "1",
      type: "comment",
      issueKey: reviewIssues[0]?.key || "PROJ-123",
      message: "Can you review the latest changes?",
      author: "Alice Johnson",
      time: "2h ago",
    },
    {
      id: "2",
      type: "approval",
      issueKey: reviewIssues[1]?.key || "PROJ-124",
      message: "Pull request approved",
      author: "Bob Smith",
      time: "4h ago",
    },
  ];

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Mentions & Reviews</h3>
        <div className="flex items-center gap-2">
          <Chip size="sm" color="primary" variant="flat">
            {reviewIssues.length + mockMentions.length} items
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            as={Link}
            href="/mentions"
          >
            <Icon icon="solar:external-link-bold" className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {/* Review Items */}
        {reviewIssues.map((issue) => (
          <div
            key={issue._id}
            className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex-shrink-0">
              <Icon icon="solar:eye-bold" className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/issues/${issue.key}`}
                  className="font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {issue.key}
                </Link>
                <Chip size="sm" color="warning" variant="flat">
                  Review Required
                </Chip>
              </div>
              <p className="text-sm text-neutral-300 truncate">{issue.title}</p>
              <p className="text-xs text-neutral-400 mt-1">
                Waiting for your review
              </p>
            </div>
          </div>
        ))}

        {/* Mock Mentions */}
        {mockMentions.map((mention) => (
          <div
            key={mention.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex-shrink-0">
              <Icon
                icon={
                  mention.type === "comment"
                    ? "solar:chat-round-bold"
                    : "solar:check-circle-bold"
                }
                className={`w-5 h-5 ${
                  mention.type === "comment"
                    ? "text-blue-400"
                    : "text-green-400"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/issues/${mention.issueKey}`}
                  className="font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {mention.issueKey}
                </Link>
                <span className="text-xs text-neutral-400">{mention.time}</span>
              </div>
              <p className="text-sm text-neutral-300">{mention.message}</p>
              <p className="text-xs text-neutral-400 mt-1">
                by {mention.author}
              </p>
            </div>
          </div>
        ))}

        {reviewIssues.length === 0 && mockMentions.length === 0 && (
          <div className="text-center py-6 text-neutral-400">
            <Icon icon="solar:inbox-bold" className="w-10 h-10 mx-auto mb-2" />
            <p>No mentions or reviews</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
