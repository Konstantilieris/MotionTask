"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Button, Select, SelectItem, Input, Chip } from "@heroui/react";
import { Download, TrendingUp, Timer, Target, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

interface SprintKPI {
  sprintId: string;
  key: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  committedPoints: number;
  completedPoints: number;
  addedScopePoints: number;
  removedScopePoints: number;
  spilloverPoints: number;
  commitmentReliability: number;
  throughputIssues: number;
  cycleTimeDays: number;
  leadTimeDays: number;
}

interface VelocityStats {
  series: number[];
  avg: number;
  median: number;
  last5Avg: number;
  last5Median: number;
}

interface AnalyticsData {
  sprints: SprintKPI[];
  velocity: VelocityStats;
  forecastNextSprintPoints: number;
}

interface BurndownData {
  sprint: {
    id: string;
    key: string;
    name: string;
  };
  points: Array<{
    day: string;
    ideal: number;
    actual: number;
  }>;
}

interface VelocityPoint {
  sprint: string;
  sprintName: string;
  points: number;
}

interface CFDData {
  buckets: string[];
  days: Array<{
    day: string;
    [status: string]: string | number;
  }>;
}

export default function SprintsAnalyticsPage() {
  const params = useParams();
  const projectKey = params.key as string;

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [velocityData, setVelocityData] = useState<{
    series: VelocityPoint[];
  } | null>(null);
  const [cfdData, setCfdData] = useState<CFDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("burndown");

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

  const loadAnalyticsData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("from", dateFrom.toISOString());
      if (dateTo) params.append("to", dateTo.toISOString());
      statusFilter.forEach((status) => params.append("status", status));

      const response = await fetch(
        `/api/projects/${projectKey}/sprints/analytics?${params}`
      );
      if (!response.ok) throw new Error("Failed to load analytics data");

      const data = await response.json();
      setAnalyticsData(data);

      // Auto-select the most recent sprint for burndown
      if (data.sprints.length > 0 && !selectedSprintId) {
        setSelectedSprintId(data.sprints[data.sprints.length - 1].sprintId);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      // toast.error('Failed to load sprint analytics');
    } finally {
      setLoading(false);
    }
  }, [projectKey, dateFrom, dateTo, statusFilter, selectedSprintId]);

  const loadBurndownData = useCallback(
    async (sprintId: string) => {
      try {
        const response = await fetch(
          `/api/projects/${projectKey}/sprints/${sprintId}/burndown`
        );
        if (!response.ok) throw new Error("Failed to load burndown data");

        const data = await response.json();
        setBurndownData(data);
      } catch (error) {
        console.error("Error loading burndown:", error);
        // toast.error('Failed to load burndown chart');
      }
    },
    [projectKey]
  );

  const loadVelocityData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectKey}/sprints/velocity`
      );
      if (!response.ok) throw new Error("Failed to load velocity data");

      const data = await response.json();
      setVelocityData(data);
    } catch (error) {
      console.error("Error loading velocity:", error);
      // toast.error('Failed to load velocity chart');
    }
  }, [projectKey]);

  const loadCFDData = useCallback(
    async (sprintId: string) => {
      try {
        const response = await fetch(
          `/api/projects/${projectKey}/sprints/${sprintId}/cfd`
        );
        if (!response.ok) throw new Error("Failed to load CFD data");

        const data = await response.json();
        setCfdData(data);
      } catch (error) {
        console.error("Error loading CFD:", error);
        // toast.error('Failed to load cumulative flow diagram');
      }
    },
    [projectKey]
  );

  useEffect(() => {
    const loadData = async () => {
      await loadAnalyticsData();
      await loadVelocityData();
    };
    loadData();
  }, [loadAnalyticsData, loadVelocityData]);

  useEffect(() => {
    const loadChartData = async () => {
      if (selectedSprintId) {
        await loadBurndownData(selectedSprintId);
        await loadCFDData(selectedSprintId);
      }
    };
    loadChartData();
  }, [selectedSprintId, loadBurndownData, loadCFDData]);

  const exportCSV = () => {
    if (!analyticsData) return;

    const headers = [
      "Sprint Key",
      "Sprint Name",
      "Start Date",
      "End Date",
      "Status",
      "Committed Points",
      "Completed Points",
      "Added Scope Points",
      "Removed Scope Points",
      "Spillover Points",
      "Commitment Reliability %",
      "Throughput Issues",
      "Cycle Time (days)",
      "Lead Time (days)",
    ];

    const rows = analyticsData.sprints.map((sprint) => [
      sprint.key,
      sprint.name,
      sprint.startDate,
      sprint.endDate,
      sprint.status,
      sprint.committedPoints,
      sprint.completedPoints,
      sprint.addedScopePoints,
      sprint.removedScopePoints,
      sprint.spilloverPoints,
      Math.round(sprint.commitmentReliability * 100),
      sprint.throughputIssues,
      Math.round(sprint.cycleTimeDays * 10) / 10,
      Math.round(sprint.leadTimeDays * 10) / 10,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectKey}-sprints-analytics.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400">Loading sprint analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Sprint Analytics
          </h1>
          <p className="text-neutral-400">
            Performance insights and metrics for all sprints
          </p>
        </div>
        <Button
          className="inline-flex items-center gap-2"
          variant="bordered"
          onPress={exportCSV}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-neutral-800">
        <CardHeader>
          <h3 className="text-lg font-semibold">Filters</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setDateFrom(e.target.value ? new Date(e.target.value) : null)
                }
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">
                To Date
              </label>
              <Input
                type="date"
                value={dateTo?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setDateTo(e.target.value ? new Date(e.target.value) : null)
                }
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-2 block">
                Status
              </label>
              <Select
                placeholder="All statuses"
                selectionMode="multiple"
                selectedKeys={statusFilter}
                onSelectionChange={(keys) =>
                  setStatusFilter(new Set(Array.from(keys as Set<string>)))
                }
              >
                <SelectItem key="active">Active</SelectItem>
                <SelectItem key="completed">Completed</SelectItem>
                <SelectItem key="planned">Planned</SelectItem>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onPress={() => {
                  setDateFrom(null);
                  setDateTo(null);
                  setStatusFilter(new Set());
                }}
                variant="light"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Tiles */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Velocity (Median)</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-semibold text-neutral-100">
                {Math.round(analyticsData.velocity.median)}
              </div>
              <p className="text-sm text-neutral-400">
                Avg: {Math.round(analyticsData.velocity.avg)} pts
              </p>
            </CardBody>
          </Card>

          <Card className="bg-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="font-semibold">Reliability</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-semibold text-neutral-100">
                {Math.round(
                  (analyticsData.sprints.reduce(
                    (sum, s) => sum + s.commitmentReliability,
                    0
                  ) /
                    analyticsData.sprints.length) *
                    100
                )}
                %
              </div>
              <p className="text-sm text-neutral-400">Commitment reliability</p>
            </CardBody>
          </Card>

          <Card className="bg-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-semibold">Scope Change</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-semibold text-neutral-100">
                {Math.round(
                  (analyticsData.sprints.reduce(
                    (sum, s) => sum + s.addedScopePoints + s.removedScopePoints,
                    0
                  ) /
                    analyticsData.sprints.reduce(
                      (sum, s) => sum + s.committedPoints,
                      0
                    )) *
                    100
                )}
                %
              </div>
              <p className="text-sm text-neutral-400">Avg scope change</p>
            </CardBody>
          </Card>

          <Card className="bg-neutral-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="font-semibold">Forecast</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-semibold text-neutral-100">
                {Math.round(analyticsData.forecastNextSprintPoints)}
              </div>
              <p className="text-sm text-neutral-400">Next sprint points</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Card className="bg-neutral-800">
        <CardBody className="pt-6">
          <div className="flex border-b border-neutral-800 mb-6">
            {[
              { key: "burndown", label: "Burndown" },
              { key: "velocity", label: "Velocity" },
              { key: "cfd", label: "CFD" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-neutral-400 hover:text-neutral-300"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "burndown" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-neutral-400">Sprint:</span>
                <Select
                  placeholder="Select sprint"
                  selectedKeys={selectedSprintId ? [selectedSprintId] : []}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as string;
                    setSelectedSprintId(key);
                  }}
                  className="w-64"
                >
                  {(analyticsData?.sprints || []).map((sprint) => (
                    <SelectItem key={sprint.sprintId}>
                      {sprint.key} - {sprint.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={burndownData?.points || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ideal"
                      stroke="#94A3B8"
                      strokeDasharray="5 5"
                      name="Ideal"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "velocity" && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData?.series || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="sprint" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="points"
                    fill="#3B82F6"
                    name="Completed Points"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "cfd" && cfdData && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cfdData.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                  />
                  {cfdData.buckets.map((bucket, index) => (
                    <Area
                      key={bucket}
                      type="monotone"
                      dataKey={bucket}
                      stackId="1"
                      fill={`hsl(${index * 60}, 70%, 50%)`}
                      name={bucket.charAt(0).toUpperCase() + bucket.slice(1)}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Sprints Table */}
      {analyticsData && (
        <Card className="bg-neutral-800">
          <CardHeader>
            <h3 className="text-lg font-semibold">Sprint Details</h3>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-neutral-400">
                      Sprint
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-400">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-400">
                      Committed
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-400">
                      Completed
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-400">
                      Reliability
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-400">
                      Throughput
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-400">
                      Cycle Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.sprints.map((sprint) => (
                    <tr
                      key={sprint.sprintId}
                      className="border-b border-neutral-800"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-neutral-200">
                            {sprint.key}
                          </div>
                          <div className="text-sm text-neutral-400">
                            {sprint.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Chip
                          size="sm"
                          color={
                            sprint.status === "completed"
                              ? "success"
                              : "default"
                          }
                          variant="flat"
                        >
                          {sprint.status}
                        </Chip>
                      </td>
                      <td className="text-right py-3 px-4 text-neutral-200">
                        {sprint.committedPoints}
                      </td>
                      <td className="text-right py-3 px-4 text-neutral-200">
                        {sprint.completedPoints}
                      </td>
                      <td className="text-right py-3 px-4 text-neutral-200">
                        {Math.round(sprint.commitmentReliability * 100)}%
                      </td>
                      <td className="text-right py-3 px-4 text-neutral-200">
                        {sprint.throughputIssues}
                      </td>
                      <td className="text-right py-3 px-4 text-neutral-200">
                        {Math.round(sprint.cycleTimeDays * 10) / 10}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
