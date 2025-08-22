"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProject {
  id: string;
  key: string;
  name: string;
  issueCount: number;
  activeIssues: number;
  team?: {
    name: string;
    slug: string;
  };
}

interface Issue {
  _id: string;
  key: string;
  title: string;
  type: "epic" | "story" | "task" | "bug" | "subtask";
  status: string;
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  assignee?: {
    _id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  storyPoints?: number;
  project: {
    key: string;
    name: string;
  };
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

interface Sprint {
  _id: string;
  name: string;
  status: "planning" | "active" | "completed";
  startDate: string;
  endDate: string;
  project: {
    _id: string;
    key: string;
    name: string;
  };
  goal?: string;
  createdAt: string;
}

interface DashboardStats {
  totalIssues: number;
  myAssignedIssues: number;
  overdueIssues: number;
  completedIssues: number;
  averageVelocity: number;
  averageLeadTime: number;
  activeSprintsCount: number;
}

interface DashboardData {
  projects: DashboardProject[];
  myIssues: Issue[];
  activeSprints: Sprint[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalIssues: 0,
    myAssignedIssues: 0,
    overdueIssues: 0,
    completedIssues: 0,
    averageVelocity: 0,
    averageLeadTime: 0,
    activeSprintsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [projectsRes, issuesRes, sprintsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/issues?assignee=me"),
          fetch("/api/sprints?status=active,planned"),
        ]);

        // Check all responses
        if (!projectsRes.ok) throw new Error("Failed to fetch projects");
        if (!issuesRes.ok) throw new Error("Failed to fetch issues");
        if (!sprintsRes.ok) throw new Error("Failed to fetch sprints");

        const [projectsData, issuesData, sprintsData] = await Promise.all([
          projectsRes.json(),
          issuesRes.json(),
          sprintsRes.json(),
        ]);

        // Process projects
        const projectsArray = projectsData.projects || [];
        const transformedProjects: DashboardProject[] = projectsArray.map(
          (project: {
            _id: string;
            key: string;
            name: string;
            team?: { name: string; slug: string };
          }) => ({
            id: project._id,
            key: project.key,
            name: project.name,
            issueCount: 0, // Will be calculated from issues
            activeIssues: 0, // Will be calculated from issues
            team: project.team,
          })
        );

        // Process issues
        const issuesArray = issuesData.issues || issuesData || [];
        const transformedIssues: Issue[] = issuesArray;

        // Process sprints
        const sprintsArray = sprintsData.sprints || sprintsData || [];
        const transformedSprints: Sprint[] = sprintsArray;

        // Calculate project issue counts
        const projectIssueCounts: {
          [key: string]: { total: number; active: number };
        } = {};
        transformedIssues.forEach((issue) => {
          const projectKey = issue.project?.key;
          if (projectKey) {
            if (!projectIssueCounts[projectKey]) {
              projectIssueCounts[projectKey] = { total: 0, active: 0 };
            }
            projectIssueCounts[projectKey].total++;
            if (issue.status !== "Done" && issue.status !== "Closed") {
              projectIssueCounts[projectKey].active++;
            }
          }
        });

        // Update projects with issue counts
        const projectsWithCounts = transformedProjects.map((project) => ({
          ...project,
          issueCount: projectIssueCounts[project.key]?.total || 0,
          activeIssues: projectIssueCounts[project.key]?.active || 0,
        }));

        setProjects(projectsWithCounts);
        setMyIssues(transformedIssues);
        setActiveSprints(transformedSprints);

        // Calculate dashboard stats
        const totalIssues = transformedIssues.length;
        const myAssignedIssues = transformedIssues.filter(
          (issue) => issue.assignee?._id === user.id
        ).length;

        const now = new Date();
        const overdueIssues = transformedIssues.filter((issue) => {
          if (!issue.dueDate) return false;
          const dueDate = new Date(issue.dueDate);
          return (
            dueDate < now &&
            issue.status !== "Done" &&
            issue.status !== "Closed"
          );
        }).length;

        const completedIssues = transformedIssues.filter(
          (issue) => issue.status === "Done" || issue.status === "Closed"
        ).length;

        setStats({
          totalIssues,
          myAssignedIssues,
          overdueIssues,
          completedIssues,
          averageVelocity: 42, // TODO: Calculate from sprint data
          averageLeadTime: 3.2, // TODO: Calculate from issue cycle times
          activeSprintsCount: transformedSprints.length,
        });
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  return {
    projects,
    myIssues,
    activeSprints,
    stats,
    isLoading,
    error,
  };
}
