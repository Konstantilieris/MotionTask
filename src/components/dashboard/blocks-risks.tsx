"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Button,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface BlockerRisk {
  id: string;
  type: "stale_wip" | "reopened" | "long_cycle" | "blocker" | "scope_creep";
  severity: "high" | "medium" | "low";
  issueKey: string;
  issueTitle: string;
  description: string;
  daysAffected: number;
  project: {
    key: string;
    name: string;
  };
  assignee?: {
    name: string;
    avatar?: string;
  };
  suggestedAction?: string;
}

export function BlocksAndRisks() {
  const [risks, setRisks] = useState<BlockerRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockRisks: BlockerRisk[] = [
      {
        id: "1",
        type: "stale_wip",
        severity: "high",
        issueKey: "PROJ-120",
        issueTitle: "Database migration script",
        description: "No updates for 5 days while in progress",
        daysAffected: 5,
        project: { key: "PROJ", name: "Motion Task" },
        assignee: { name: "John Doe" },
        suggestedAction: "Check with assignee for status update",
      },
      {
        id: "2",
        type: "reopened",
        severity: "medium",
        issueKey: "WEB-43",
        issueTitle: "Mobile navigation fixes",
        description: "Reopened after being marked done",
        daysAffected: 2,
        project: { key: "WEB", name: "Website" },
        assignee: { name: "Alice Johnson" },
        suggestedAction: "Review QA feedback and testing criteria",
      },
      {
        id: "3",
        type: "long_cycle",
        severity: "medium",
        issueKey: "PROJ-118",
        issueTitle: "User permission system",
        description: "In progress for 12 days, typical cycle time is 5 days",
        daysAffected: 12,
        project: { key: "PROJ", name: "Motion Task" },
        assignee: { name: "Bob Smith" },
        suggestedAction: "Break down into smaller tasks",
      },
      {
        id: "4",
        type: "blocker",
        severity: "high",
        issueKey: "API-25",
        issueTitle: "Third-party API integration",
        description: "Blocked by external vendor API limitations",
        daysAffected: 3,
        project: { key: "API", name: "Integrations" },
        assignee: { name: "Carol Davis" },
        suggestedAction: "Escalate to vendor or find alternative approach",
      },
    ];

    setTimeout(() => {
      setRisks(mockRisks);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getRiskIcon = (type: string) => {
    switch (type) {
      case "stale_wip":
        return "solar:clock-circle-bold";
      case "reopened":
        return "solar:refresh-bold";
      case "long_cycle":
        return "solar:hourglass-bold";
      case "blocker":
        return "solar:shield-cross-bold";
      case "scope_creep":
        return "solar:chart-2-bold";
      default:
        return "solar:danger-triangle-bold";
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-blue-400";
      default:
        return "text-neutral-400";
    }
  };

  const getRiskLabel = (type: string) => {
    switch (type) {
      case "stale_wip":
        return "Stale WIP";
      case "reopened":
        return "Reopened";
      case "long_cycle":
        return "Long Cycle";
      case "blocker":
        return "Blocked";
      case "scope_creep":
        return "Scope Creep";
      default:
        return "Risk";
    }
  };

  const dismissRisk = (id: string) => {
    setRisks((prev) => prev.filter((risk) => risk.id !== id));
  };

  const snoozeRisk = (id: string) => {
    // Mock snooze functionality
    console.log("Snoozing risk:", id);
  };

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border border-neutral-700">
        <CardHeader>
          <h3 className="text-lg font-semibold">Blocks & Risks</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-neutral-800 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  const highRisks = risks.filter((r) => r.severity === "high");
  const otherRisks = risks.filter((r) => r.severity !== "high");

  return (
    <Card className="bg-neutral-900 border border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Blocks & Risks</h3>
          {highRisks.length > 0 && (
            <Chip size="sm" color="danger" variant="flat">
              {highRisks.length} high
            </Chip>
          )}
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          as={Link}
          href="/analytics/risks"
        >
          <Icon icon="solar:external-link-bold" className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {risks.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <Icon
              icon="solar:shield-check-bold"
              className="w-12 h-12 mx-auto mb-2"
            />
            <p>No risks detected</p>
            <p className="text-sm">All issues are progressing normally</p>
          </div>
        ) : (
          <>
            {/* High Priority Risks First */}
            {highRisks.map((risk) => (
              <div
                key={risk.id}
                className="p-3 rounded-lg border border-red-500/30 bg-red-950/20"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    icon={getRiskIcon(risk.type)}
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getRiskColor(
                      risk.severity
                    )}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/issues/${risk.issueKey}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors"
                      >
                        {risk.issueKey}
                      </Link>
                      <Chip
                        size="sm"
                        color="danger"
                        variant="flat"
                        className="capitalize"
                      >
                        {getRiskLabel(risk.type)}
                      </Chip>
                      <Chip size="sm" variant="bordered" className="text-xs">
                        {risk.project.key}
                      </Chip>
                    </div>

                    <p className="text-sm text-neutral-300 mb-2 line-clamp-1">
                      {risk.issueTitle}
                    </p>

                    <p className="text-sm text-neutral-400 mb-2">
                      {risk.description}
                    </p>

                    {risk.suggestedAction && (
                      <div className="flex items-start gap-2 p-2 bg-blue-950/30 rounded border border-blue-500/20">
                        <Icon
                          icon="solar:lightbulb-bold"
                          className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-sm text-blue-300">
                          <span className="font-medium">Suggested:</span>{" "}
                          {risk.suggestedAction}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        {risk.assignee && (
                          <span>Assigned to {risk.assignee.name}</span>
                        )}
                        <span>• {risk.daysAffected} days</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Tooltip content="Snooze for 1 day">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => snoozeRisk(risk.id)}
                          >
                            <Icon icon="solar:clock-bold" className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Mark as resolved">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => dismissRisk(risk.id)}
                          >
                            <Icon
                              icon="solar:check-circle-bold"
                              className="w-4 h-4"
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Other Risks */}
            {otherRisks.map((risk) => (
              <div
                key={risk.id}
                className="p-3 rounded-lg border border-neutral-700 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    icon={getRiskIcon(risk.type)}
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${getRiskColor(
                      risk.severity
                    )}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/issues/${risk.issueKey}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors text-sm"
                      >
                        {risk.issueKey}
                      </Link>
                      <Chip
                        size="sm"
                        color={
                          risk.severity === "medium" ? "warning" : "default"
                        }
                        variant="flat"
                        className="capitalize text-xs"
                      >
                        {getRiskLabel(risk.type)}
                      </Chip>
                    </div>

                    <p className="text-sm text-neutral-400 line-clamp-1">
                      {risk.description}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-500">
                        {risk.daysAffected} days
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => dismissRisk(risk.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon
                          icon="solar:close-circle-bold"
                          className="w-4 h-4"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardBody>
    </Card>
  );
}
