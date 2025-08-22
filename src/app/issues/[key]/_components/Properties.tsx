"use client";

import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface PropertiesProps {
  issue: {
    _id: string;
    assignee?: {
      _id: string;
      name: string;
      email: string;
    };
    reporter: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    priority: string;
    type: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    dueDate?: string | Date;
    estimation?: number;
    storyPoints?: number;
    labels?: string[];
    components?: string[];
    fixVersions?: string[];
    affectsVersions?: string[];
  };
}

export default function Properties({ issue }: PropertiesProps) {
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const PropertyField = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <div className="text-sm text-gray-200">{children}</div>
    </div>
  );

  const UserAvatar = ({
    user,
  }: {
    user: { name: string; avatar?: string };
  }) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <span className="text-gray-200">{user.name}</span>
    </div>
  );

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">Properties</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="space-y-6">
        <PropertyField label="Assignee">
          {issue.assignee ? (
            <UserAvatar user={issue.assignee} />
          ) : (
            <span className="text-gray-500 italic">Unassigned</span>
          )}
        </PropertyField>

        <PropertyField label="Reporter">
          <UserAvatar user={issue.reporter} />
        </PropertyField>

        <PropertyField label="Status">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              issue.status === "Done"
                ? "text-green-400 bg-green-900/50"
                : issue.status === "In Progress"
                ? "text-blue-400 bg-blue-900/50"
                : issue.status === "Blocked"
                ? "text-red-400 bg-red-900/50"
                : "text-gray-400 bg-gray-800/50"
            }`}
          >
            {issue.status}
          </span>
        </PropertyField>

        <PropertyField label="Priority">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-4 w-4 ${
                issue.priority === "Critical"
                  ? "text-red-400"
                  : issue.priority === "High"
                  ? "text-orange-400"
                  : issue.priority === "Medium"
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            />
            <span className="text-gray-200">{issue.priority}</span>
          </div>
        </PropertyField>

        <PropertyField label="Type">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              issue.type === "Bug"
                ? "text-red-400 bg-red-900/50"
                : issue.type === "Feature"
                ? "text-blue-400 bg-blue-900/50"
                : issue.type === "Task"
                ? "text-green-400 bg-green-900/50"
                : issue.type === "Epic"
                ? "text-purple-400 bg-purple-900/50"
                : "text-gray-400 bg-gray-800/50"
            }`}
          >
            {issue.type}
          </span>
        </PropertyField>

        {issue.dueDate && (
          <PropertyField label="Due Date">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-200">{formatDate(issue.dueDate)}</span>
            </div>
          </PropertyField>
        )}

        {issue.storyPoints && (
          <PropertyField label="Story Points">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600/50 text-blue-400 rounded text-xs font-bold flex items-center justify-center border border-blue-500/30">
                {issue.storyPoints}
              </div>
              <span className="text-gray-200">{issue.storyPoints} points</span>
            </div>
          </PropertyField>
        )}

        {issue.estimation && (
          <PropertyField label="Time Estimation">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-200">{issue.estimation}h</span>
            </div>
          </PropertyField>
        )}

        <PropertyField label="Created">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-200">{formatDate(issue.createdAt)}</span>
          </div>
        </PropertyField>

        <PropertyField label="Updated">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-200">{formatDate(issue.updatedAt)}</span>
          </div>
        </PropertyField>

        {issue.labels && issue.labels.length > 0 && (
          <PropertyField label="Labels">
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-800/50 text-gray-300 border border-gray-600/50"
                >
                  {label}
                </span>
              ))}
            </div>
          </PropertyField>
        )}

        {issue.components && issue.components.length > 0 && (
          <PropertyField label="Components">
            <div className="space-y-1">
              {issue.components.map((component, index) => (
                <div key={index} className="text-sm text-gray-300">
                  {component}
                </div>
              ))}
            </div>
          </PropertyField>
        )}
      </div>
    </div>
  );
}
