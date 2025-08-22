"use client";

import { Plus, Square, CheckSquare, MoreVertical, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Subtask {
  _id: string;
  key: string;
  title: string;
  status: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
}

interface SubtasksProps {
  issueId: string;
}

// Modal component for adding subtasks
function AddSubtaskModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, assignee?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(title, assignee || undefined);
      setTitle("");
      setAssignee("");
      onClose();
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Add Subtask</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter subtask title..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-400"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assignee (optional)
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Enter assignee name..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Adding..." : "Add Subtask"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Subtask {
  _id: string;
  key: string;
  title: string;
  status: string;
  assignee?: {
    name: string;
    avatar?: string;
  };
}

interface SubtasksProps {
  issueId: string;
}

export default function Subtasks({ issueId }: SubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSubtasks = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/issues/${issueId}/subtasks`);
        if (response.ok) {
          const data = await response.json();
          setSubtasks(data.subtasks || []);
        } else {
          // Show empty state when API is not available
          setSubtasks([]);
        }
      } catch (error) {
        console.error("Failed to fetch subtasks:", error);
        setSubtasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubtasks();
  }, [issueId]);

  const handleAddSubtask = async (title: string, assignee?: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, assignee }),
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks((prev) => [...prev, newSubtask]);
      } else {
        throw new Error("Failed to create subtask");
      }
    } catch (error) {
      console.error("Failed to create subtask:", error);
      throw error;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "Done" ? (
      <CheckSquare className="h-4 w-4 text-green-400" />
    ) : (
      <Square className="h-4 w-4 text-gray-500" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "text-green-400";
      case "In Progress":
        return "text-blue-400";
      case "To Do":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">
            Subtasks ({subtasks.length})
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {subtasks.map((subtask) => (
            <div
              key={subtask._id}
              className="flex items-center gap-3 p-3 hover:bg-gray-800/50 rounded-lg group transition-colors border border-gray-700/50"
            >
              {getStatusIcon(subtask.status)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/issues/${subtask.key}`}
                    className="text-sm font-medium text-gray-200 hover:text-blue-400 truncate"
                  >
                    {subtask.title}
                  </Link>
                  <span className="text-xs text-gray-500 font-mono">
                    {subtask.key}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-1">
                  <span className={`text-xs ${getStatusColor(subtask.status)}`}>
                    {subtask.status}
                  </span>
                  {subtask.assignee && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {subtask.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-400">
                        {subtask.assignee.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                aria-label="More options"
                title="More options"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          ))}

          {subtasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
              <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subtasks yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
              >
                Add the first subtask
              </button>
            </div>
          )}
        </div>
      </div>

      <AddSubtaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddSubtask}
      />
    </>
  );
}
