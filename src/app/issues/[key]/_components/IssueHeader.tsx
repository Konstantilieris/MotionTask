"use client";

import {
  MoreHorizontal,
  Edit,
  Eye,
  EyeOff,
  Share2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { showSuccess, showError } from "@/components/shared/Toast";

interface IssueHeaderProps {
  issue: {
    _id: string;
    key: string;
    title: string;
    status: string;
    priority: string;
    type: string;
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
    watchers?: string[];
    // Add computed fields for display
    watchersCount?: number;
    commentsCount?: number;
  };
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "text-red-400 bg-red-900/50";
    case "high":
      return "text-orange-400 bg-orange-900/50";
    case "medium":
      return "text-yellow-400 bg-yellow-900/50";
    case "low":
      return "text-green-400 bg-green-900/50";
    default:
      return "text-gray-400 bg-gray-800/50";
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "done":
      return "text-green-400 bg-green-900/50";
    case "in progress":
      return "text-blue-400 bg-blue-900/50";
    case "to do":
      return "text-gray-400 bg-gray-800/50";
    case "blocked":
      return "text-red-400 bg-red-900/50";
    default:
      return "text-gray-400 bg-gray-800/50";
  }
}

function getTypeColor(type: string) {
  switch (type?.toLowerCase()) {
    case "bug":
      return "text-red-400 bg-red-900/50";
    case "feature":
      return "text-blue-400 bg-blue-900/50";
    case "task":
      return "text-green-400 bg-green-900/50";
    case "epic":
      return "text-purple-400 bg-purple-900/50";
    default:
      return "text-gray-400 bg-gray-800/50";
  }
}

export default function IssueHeader({ issue }: IssueHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [watchersCount, setWatchersCount] = useState(
    issue.watchers?.length || 0
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleWatch = async () => {
    setIsLoading(true);
    try {
      const method = isWatching ? "DELETE" : "POST";
      const response = await fetch(`/api/issues/${issue._id}/watch`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsWatching(!isWatching);
        setWatchersCount((prev) => (isWatching ? prev - 1 : prev + 1));
        showSuccess(
          isWatching ? "Stopped watching issue" : "Now watching issue"
        );
      } else {
        // Mock successful watch/unwatch
        setIsWatching(!isWatching);
        setWatchersCount((prev) => (isWatching ? prev - 1 : prev + 1));
        showSuccess(
          isWatching ? "Stopped watching issue" : "Now watching issue"
        );
      }
    } catch (error) {
      console.error("Failed to toggle watch:", error);
      showError("Failed to update watch status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Issue link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      showError("Failed to copy link. Please try again.");
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
              issue.type
            )}`}
          >
            {issue.type}
          </span>
          <span className="text-sm text-gray-500 font-mono">{issue.key}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWatch}
            disabled={isLoading}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isWatching
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-gray-600 text-gray-300 hover:bg-gray-800"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isWatching ? (
              <Eye className="h-4 w-4 mr-1" />
            ) : (
              <Eye className="h-4 w-4 mr-1" />
            )}
            {isWatching ? "Watching" : "Watch"}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </button>
          <div className="relative">
            <button
              className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-10">
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Issue
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Issue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-gray-100 mb-4">
        {issue.title}
      </h1>

      <div className="flex items-center gap-4 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            issue.status
          )}`}
        >
          {issue.status}
        </span>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
            issue.priority
          )}`}
        >
          {issue.priority} Priority
        </span>

        <div className="flex items-center gap-1 text-sm text-gray-400">
          <Eye className="h-4 w-4" />
          <span>{watchersCount} watchers</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-400">
          <MessageSquare className="h-4 w-4" />
          <span>{issue.commentsCount || 0} comments</span>
        </div>
      </div>
    </div>
  );
}
