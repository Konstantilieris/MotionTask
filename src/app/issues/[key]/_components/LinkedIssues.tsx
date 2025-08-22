"use client";

import { Link2, Plus, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface LinkedIssue {
  _id: string;
  key: string;
  title: string;
  status: string;
  type: string;
}

interface LinkedIssuesProps {
  issueId: string;
}

// Modal component for linking issues
function LinkIssueModal({
  isOpen,
  onClose,
  onLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLink: (issueKey: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<LinkedIssue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(
        `/api/issues/search?q=${encodeURIComponent(searchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.issues || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkIssue = async (issueKey: string) => {
    setIsLoading(true);
    try {
      await onLink(issueKey);
      setSearchTerm("");
      setSearchResults([]);
      onClose();
    } catch (error) {
      console.error("Failed to link issue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Link Issue</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search for issue
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter issue key or title..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-400"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-400">Search Results:</p>
              {searchResults.map((issue) => (
                <div
                  key={issue._id}
                  className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {issue.key}
                      </span>
                      <span className="text-xs text-blue-400">
                        {issue.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 truncate">
                      {issue.title}
                    </p>
                    <p className="text-xs text-gray-400">{issue.status}</p>
                  </div>
                  <button
                    onClick={() => handleLinkIssue(issue.key)}
                    disabled={isLoading}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Link
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LinkedIssue {
  _id: string;
  key: string;
  title: string;
  status: string;
  type: string;
}

interface LinkedIssuesProps {
  issueId: string;
}

export default function LinkedIssues({ issueId }: LinkedIssuesProps) {
  const [linkedIssues, setLinkedIssues] = useState<LinkedIssue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkedIssues = async () => {
      try {
        const response = await fetch(`/api/issues/${issueId}/linked`);
        if (response.ok) {
          const data = await response.json();
          setLinkedIssues(data.linkedIssues || []);
        } else {
          setLinkedIssues([]);
        }
      } catch (error) {
        console.error("Failed to fetch linked issues:", error);
        setLinkedIssues([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkedIssues();
  }, [issueId]);

  const handleLinkIssue = async (issueKey: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/linked`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkedIssueKey: issueKey }),
      });

      if (response.ok) {
        // Refresh linked issues
        const refreshResponse = await fetch(`/api/issues/${issueId}/linked`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setLinkedIssues(refreshData.linkedIssues || []);
        }
      } else {
        throw new Error("Failed to link issue");
      }
    } catch (error) {
      console.error("Failed to link issue:", error);
    }
  };

  const handleUnlinkIssue = async (linkedIssueId: string) => {
    try {
      const response = await fetch(
        `/api/issues/${issueId}/linked/${linkedIssueId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setLinkedIssues((prev) =>
          prev.filter((issue) => issue._id !== linkedIssueId)
        );
      } else {
        throw new Error("Failed to unlink issue");
      }
    } catch (error) {
      console.error("Failed to unlink issue:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "to do":
        return "text-gray-400 bg-gray-800/50";
      case "in progress":
        return "text-blue-400 bg-blue-900/50";
      case "done":
        return "text-green-400 bg-green-900/50";
      default:
        return "text-gray-400 bg-gray-800/50";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "bug":
        return "text-red-400 bg-red-900/50";
      case "story":
        return "text-purple-400 bg-purple-900/50";
      case "task":
        return "text-blue-400 bg-blue-900/50";
      default:
        return "text-gray-400 bg-gray-800/50";
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-100">Linked Issues</h3>
          <span className="text-sm text-gray-400">({linkedIssues.length})</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Link Issue
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-800/50 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : linkedIssues.length === 0 ? (
        <div className="text-center py-8">
          <Link2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No linked issues</p>
          <p className="text-sm text-gray-500">
            Link related issues to track dependencies and relationships
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {linkedIssues.map((issue) => (
            <div
              key={issue._id}
              className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/issues/${issue.key}`}
                  className="block hover:text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 font-mono">
                      {issue.key}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(
                        issue.type
                      )}`}
                    >
                      {issue.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                    {issue.title}
                  </p>
                </Link>
              </div>
              <button
                onClick={() => handleUnlinkIssue(issue._id)}
                className="ml-3 p-1 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Unlink issue"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <LinkIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLink={handleLinkIssue}
      />
    </div>
  );
}
