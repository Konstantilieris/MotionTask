"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Button,
  Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface TeamSnapshot {
  currentSprint: {
    name: string;
    progress: number;
    scopeChanges: number;
    blockers: Array<{
      id: string;
      title: string;
      severity: "high" | "medium" | "low";
    }>;
  };
  velocity: number[];
  metrics: {
    leadTime: number;
    cycleTime: number;
  };
  announcements: Array<{
    id: string;
    type: "release" | "outage" | "meeting";
    title: string;
    timestamp: string;
    isImportant: boolean;
  }>;
}

interface WatchedIssue {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  recentChanges: Array<{
    type: "status" | "comment" | "assignment" | "update";
    timestamp: string;
    user?: string;
    description: string;
  }>;
  project: {
    key: string;
    name: string;
  };
}

interface RecentlyViewed {
  id: string;
  type: "issue" | "project" | "sprint";
  key: string;
  title: string;
  url: string;
  timestamp: string;
  isPinned: boolean;
}

export function TeamSnapshot() {
  const [teamData, setTeamData] = useState<TeamSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockTeamData: TeamSnapshot = {
      currentSprint: {
        name: "Sprint 2024-08",
        progress: 65,
        scopeChanges: 2,
        blockers: [
          {
            id: "1",
            title: "API rate limit blocking user sync",
            severity: "high",
          },
          {
            id: "2",
            title: "Database migration pending approval",
            severity: "medium",
          },
        ],
      },
      velocity: [38, 42, 35, 48, 41],
      metrics: {
        leadTime: 4.2,
        cycleTime: 2.8,
      },
      announcements: [
        {
          id: "1",
          type: "release",
          title: "v2.1.0 released with new dashboard features",
          timestamp: "2 hours ago",
          isImportant: true,
        },
        {
          id: "2",
          type: "meeting",
          title: "Sprint retrospective tomorrow 2PM",
          timestamp: "5 hours ago",
          isImportant: false,
        },
        {
          id: "3",
          type: "outage",
          title: "Database maintenance window scheduled",
          timestamp: "1 day ago",
          isImportant: true,
        },
      ],
    };

    setTimeout(() => {
      setTeamData(mockTeamData);
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Team Snapshot</h3>
        </CardHeader>
        <CardBody>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-neutral-800 rounded"></div>
            <div className="h-16 bg-neutral-800 rounded"></div>
            <div className="h-24 bg-neutral-800 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!teamData) return null;

  const averageVelocity =
    teamData.velocity.reduce((a, b) => a + b, 0) / teamData.velocity.length;
  const velocityTrend =
    teamData.velocity[teamData.velocity.length - 1] >
    teamData.velocity[teamData.velocity.length - 2]
      ? "up"
      : "down";

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader>
        <h3 className="text-lg font-semibold">Team Snapshot</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Active Sprint */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-neutral-300">
              Active Sprint
            </h4>
            <Button
              size="sm"
              variant="light"
              as={Link}
              href="/sprints/current"
              className="text-xs"
            >
              View Details
            </Button>
          </div>
          <div className="p-3 bg-neutral-800/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {teamData.currentSprint.name}
              </span>
              <span className="text-sm text-neutral-400">
                {teamData.currentSprint.progress}% complete
              </span>
            </div>
            <Progress
              value={teamData.currentSprint.progress}
              color={
                teamData.currentSprint.progress >= 70
                  ? "success"
                  : teamData.currentSprint.progress >= 40
                  ? "warning"
                  : "danger"
              }
            />
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>{teamData.currentSprint.scopeChanges} scope changes</span>
              <span>{teamData.currentSprint.blockers.length} blockers</span>
            </div>
          </div>
        </div>

        {/* Velocity Trend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-300">
            Velocity Trend
          </h4>
          <div className="flex items-center justify-between p-3 bg-neutral-800/30 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {Math.round(averageVelocity)}
                </span>
                <Icon
                  icon={
                    velocityTrend === "up"
                      ? "solar:arrow-up-bold"
                      : "solar:arrow-down-bold"
                  }
                  className={`w-4 h-4 ${
                    velocityTrend === "up" ? "text-green-400" : "text-red-400"
                  }`}
                />
              </div>
              <p className="text-xs text-neutral-400">Average points/sprint</p>
            </div>
            <div className="flex items-end gap-1 h-8">
              {teamData.velocity.map((velocity, index) => {
                const heightPercent =
                  (velocity / Math.max(...teamData.velocity)) * 100;
                return (
                  <div
                    key={index}
                    className="bg-blue-400 w-2 rounded-t min-h-1"
                    data-height={`${heightPercent}%`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Lead/Cycle Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-neutral-800/30 rounded-lg text-center">
            <div className="text-lg font-semibold text-purple-400">
              {teamData.metrics.leadTime}d
            </div>
            <div className="text-xs text-neutral-400">Lead Time</div>
          </div>
          <div className="p-3 bg-neutral-800/30 rounded-lg text-center">
            <div className="text-lg font-semibold text-green-400">
              {teamData.metrics.cycleTime}d
            </div>
            <div className="text-xs text-neutral-400">Cycle Time</div>
          </div>
        </div>

        {/* Announcements */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-neutral-300">
            Announcements
          </h4>
          <div className="space-y-2">
            {teamData.announcements.slice(0, 2).map((announcement) => (
              <div
                key={announcement.id}
                className="p-2 bg-neutral-800/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Icon
                    icon={
                      announcement.type === "release"
                        ? "solar:rocket-bold"
                        : announcement.type === "meeting"
                        ? "solar:calendar-bold"
                        : "solar:danger-triangle-bold"
                    }
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      announcement.type === "release"
                        ? "text-green-400"
                        : announcement.type === "meeting"
                        ? "text-blue-400"
                        : "text-yellow-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-2">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {announcement.timestamp}
                    </p>
                  </div>
                  {announcement.isImportant && (
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function WatchingIssues() {
  const [watchedIssues, setWatchedIssues] = useState<WatchedIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockWatchedIssues: WatchedIssue[] = [
      {
        id: "1",
        key: "PROJ-125",
        title: "Add user profile settings",
        status: "In Progress",
        priority: "high",
        project: { key: "PROJ", name: "Motion Task" },
        recentChanges: [
          {
            type: "comment",
            timestamp: "2 hours ago",
            user: "Alice Johnson",
            description: "Added mockups for the settings page",
          },
          {
            type: "status",
            timestamp: "1 day ago",
            user: "Bob Smith",
            description: "Moved from To Do to In Progress",
          },
        ],
      },
      {
        id: "2",
        key: "WEB-46",
        title: "Optimize image loading performance",
        status: "In Review",
        priority: "medium",
        project: { key: "WEB", name: "Website" },
        recentChanges: [
          {
            type: "update",
            timestamp: "4 hours ago",
            user: "Carol Davis",
            description: "Updated implementation approach",
          },
        ],
      },
    ];

    setTimeout(() => {
      setWatchedIssues(mockWatchedIssues);
      setIsLoading(false);
    }, 900);
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Watching</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[1, 2].map((i) => (
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
        <h3 className="text-lg font-semibold">Watching</h3>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          as={Link}
          href="/issues?watched=true"
        >
          <Icon icon="solar:external-link-bold" className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {watchedIssues.length === 0 ? (
          <div className="text-center py-6 text-neutral-400">
            <Icon
              icon="solar:eye-closed-bold"
              className="w-8 h-8 mx-auto mb-2"
            />
            <p className="text-sm">No watched issues</p>
          </div>
        ) : (
          watchedIssues.map((issue) => (
            <div
              key={issue.id}
              className="p-3 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`/issues/${issue.key}`}
                  className="font-medium text-white hover:text-blue-400 transition-colors"
                >
                  {issue.key}
                </Link>
                <div className="flex items-center gap-1">
                  <Chip size="sm" variant="bordered" className="text-xs">
                    {issue.project.key}
                  </Chip>
                </div>
              </div>

              <p className="text-sm text-neutral-300 mb-2 line-clamp-1">
                {issue.title}
              </p>

              <div className="space-y-1">
                {issue.recentChanges.slice(0, 2).map((change, index) => (
                  <div key={index} className="text-xs text-neutral-400">
                    <Icon
                      icon={
                        change.type === "comment"
                          ? "solar:chat-round-dots-bold"
                          : change.type === "status"
                          ? "solar:refresh-bold"
                          : change.type === "assignment"
                          ? "solar:user-bold"
                          : "solar:edit-bold"
                      }
                      className="w-3 h-3 inline mr-1"
                    />
                    <span className="font-medium">{change.user}</span>{" "}
                    {change.description} • {change.timestamp}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}

export function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentlyViewed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockRecentItems: RecentlyViewed[] = [
      {
        id: "1",
        type: "issue",
        key: "PROJ-123",
        title: "Implement user authentication system",
        url: "/issues/PROJ-123",
        timestamp: "5 minutes ago",
        isPinned: true,
      },
      {
        id: "2",
        type: "project",
        key: "PROJ",
        title: "Motion Task Management",
        url: "/projects/PROJ",
        timestamp: "1 hour ago",
        isPinned: false,
      },
      {
        id: "3",
        type: "sprint",
        key: "Sprint 2024-08",
        title: "Sprint 2024-08",
        url: "/sprints/sprint-1",
        timestamp: "2 hours ago",
        isPinned: false,
      },
    ];

    setTimeout(() => {
      setRecentItems(mockRecentItems);
      setIsLoading(false);
    }, 500);
  }, []);

  const togglePin = (id: string) => {
    setRecentItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return "solar:bug-bold";
      case "project":
        return "solar:folder-bold";
      case "sprint":
        return "solar:calendar-bold";
      default:
        return "solar:document-bold";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Recently Viewed</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-neutral-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader>
        <h3 className="text-lg font-semibold">Recently Viewed</h3>
      </CardHeader>
      <CardBody className="space-y-2">
        {recentItems.length === 0 ? (
          <div className="text-center py-6 text-neutral-400">
            <Icon icon="solar:history-bold" className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No recent items</p>
          </div>
        ) : (
          recentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/50 transition-colors group"
            >
              <Link
                href={item.url}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <Icon
                  icon={getTypeIcon(item.type)}
                  className="w-4 h-4 text-neutral-400 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.key}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    {item.timestamp}
                  </p>
                </div>
              </Link>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => togglePin(item.id)}
              >
                <Icon
                  icon={item.isPinned ? "solar:pin-bold" : "solar:pin-outline"}
                  className={`w-4 h-4 ${
                    item.isPinned ? "text-yellow-400" : "text-neutral-400"
                  }`}
                />
              </Button>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
