"use client";

import React from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import Link from "next/link";

// Dashboard Components
import { GlobalCommandBar } from "@/components/dashboard/command-bar";
import { QuickCreate } from "@/components/dashboard/quick-create";
import { AiAsk } from "@/components/dashboard/ai-ask";
import { MyWork } from "@/components/dashboard/my-work";
import { MySprintOverview } from "@/components/dashboard/my-sprint";
import {
  DueSoonOverdue,
  MentionsAndReviews,
} from "@/components/dashboard/calendar-mentions";
import {
  TeamSnapshot,
  WatchingIssues,
  RecentlyViewed,
} from "@/components/dashboard/team-watching-recent";
import { BlocksAndRisks } from "@/components/dashboard/blocks-risks";

const MainPage = () => {
  const { user } = useAuth();
  const { projects, stats, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div className="min-h-screen overflow-y-auto bg-neutral-950 p-6">
        <Card className="bg-neutral-900 border border-red-500/30">
          <CardBody className="p-6 text-center">
            <Icon
              icon="solar:danger-triangle-bold"
              className="w-12 h-12 text-red-400 mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-white mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-neutral-400">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-950">
      <div className="p-6 space-y-6 max-w-none min-h-full">
        {/* Top Command Bar */}
        <Card className="bg-neutral-900 border border-neutral-700">
          <CardBody className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <GlobalCommandBar />
                <QuickCreate />
                <AiAsk />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">
                  Welcome back,{" "}
                  <span className="text-white font-medium">{user?.name}</span>
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Icon icon="solar:user-bold" className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - My Work Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Work Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">My Work</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <MyWork />
                <MySprintOverview />
              </div>
            </div>

            {/* Calendar and Mentions */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DueSoonOverdue />
              <MentionsAndReviews />
            </div>

            {/* Watching and Recent */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <WatchingIssues />
              <RecentlyViewed />
            </div>

            {/* Blocks and Risks */}
            <BlocksAndRisks />
          </div>

          {/* Right Sidebar - Team & Project Snapshots */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Team Insights</h2>
            <TeamSnapshot />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-neutral-900 border border-neutral-700">
                <CardBody className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-lg">
                    <Icon
                      icon="solar:chart-2-bold"
                      className="w-6 h-6 text-blue-400"
                    />
                  </div>
                  {isLoading ? (
                    <Spinner size="sm" color="primary" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white">
                        {stats.averageVelocity}
                      </div>
                      <div className="text-sm text-neutral-400">
                        Avg Velocity
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>

              <Card className="bg-neutral-900 border border-neutral-700">
                <CardBody className="p-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-lg">
                    <Icon
                      icon="solar:clock-circle-bold"
                      className="w-6 h-6 text-green-400"
                    />
                  </div>
                  {isLoading ? (
                    <Spinner size="sm" color="success" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white">
                        {stats.averageLeadTime}d
                      </div>
                      <div className="text-sm text-neutral-400">
                        Avg Lead Time
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Active Projects Quick Access */}
            <Card className="bg-neutral-900 border border-neutral-700">
              <CardBody className="p-4">
                <h3 className="font-semibold text-white mb-3">
                  Active Projects
                </h3>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-neutral-800 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400">
                    <Icon
                      icon="solar:folder-plus-bold"
                      className="w-8 h-8 mx-auto mb-2"
                    />
                    <p className="text-sm">No projects found</p>
                    <Link
                      href="/projects/new"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Create your first project
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.key}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between p-2 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <div>
                              <div className="font-medium text-white text-sm">
                                {project.key}
                              </div>
                              <div className="text-xs text-neutral-400">
                                {project.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-400">
                            {project.issueCount} issues
                          </div>
                        </div>
                      </Link>
                    ))}
                    {projects.length > 5 && (
                      <Link
                        href="/projects"
                        className="block text-center text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        View all {projects.length} projects
                      </Link>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-neutral-900 border border-neutral-700">
              <CardBody className="p-4">
                <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "Start new sprint",
                      icon: "solar:play-circle-bold",
                      url: "/sprints/new",
                    },
                    {
                      label: "View all issues",
                      icon: "solar:checklist-bold",
                      url: "/issues",
                    },
                    {
                      label: "Team analytics",
                      icon: "solar:chart-bold",
                      url: "/analytics",
                    },
                    {
                      label: "Settings",
                      icon: "solar:settings-bold",
                      url: "/settings",
                    },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.url}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 bg-neutral-800/30 rounded-lg hover:bg-neutral-800/50 transition-colors cursor-pointer">
                        <Icon
                          icon={action.icon}
                          className="w-4 h-4 text-neutral-400"
                        />
                        <span className="text-sm text-neutral-300">
                          {action.label}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
