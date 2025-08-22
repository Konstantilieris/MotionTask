"use client";

import {
  MessageSquare,
  Edit,
  User,
  Clock,
  GitBranch,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { showSuccess, showError } from "@/components/shared/Toast";

interface Activity {
  _id: string;
  type: "comment" | "updated" | "status_changed" | "assigned" | "created";
  actor: {
    name: string;
    avatar?: string;
  };
  at: string;
  meta?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
  };
}

interface ActivityFeedProps {
  issueKey: string;
}

export default function ActivityFeed({ issueKey }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/issues/${issueKey}/activities`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [issueKey]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${issueKey}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "comment",
          meta: {
            comment: newComment.trim(),
          },
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities((prev) => [...prev, newActivity]);
        setNewComment("");
        showSuccess("Comment added successfully");
      } else {
        showError("Failed to add comment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
      showError("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return activityDate.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "updated":
        return <Edit className="h-4 w-4 text-gray-400" />;
      case "status_changed":
        return <GitBranch className="h-4 w-4 text-green-400" />;
      case "assigned":
        return <User className="h-4 w-4 text-purple-400" />;
      case "created":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case "created":
        return "created this issue";
      case "comment":
        return "commented";
      case "status_changed":
        return `changed status from ${activity.meta?.oldValue} to ${activity.meta?.newValue}`;
      case "assigned":
        return `assigned this to ${activity.meta?.newValue}`;
      case "updated":
        return `updated ${activity.meta?.field}`;
      default:
        return "performed an action";
    }
  };

  const UserAvatar = ({
    user,
  }: {
    user: { name: string; avatar?: string };
  }) => (
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
      {user.name.charAt(0).toUpperCase()}
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-100 mb-6">
        Activity ({activities.length})
      </h3>

      {/* Comment Input */}
      <div className="mb-6 border border-gray-700 rounded-lg p-4 bg-gray-800/30">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full h-20 resize-none bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500"
          disabled={isSubmitting}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Posting..." : "Comment"}
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className="flex gap-3 p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <UserAvatar user={activity.actor} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {getActivityIcon(activity.type)}
                <span className="text-sm font-medium text-gray-200">
                  {activity.actor.name}
                </span>
                <span className="text-sm text-gray-400">
                  {getActivityText(activity)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(activity.at)}
                </span>
              </div>

              {activity.meta?.comment && (
                <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-600/50">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {activity.meta.comment}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
