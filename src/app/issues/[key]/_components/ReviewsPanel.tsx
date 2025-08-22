"use client";
import { useEffect, useState, useCallback } from "react";
import {
  listReviews,
  approveReview,
  requestChanges,
  cancelReview,
  toggleChecklist,
} from "@/lib/api/reviews";
import type { IReview } from "@/models/Review";

export default function ReviewsPanel({ issueId }: { issueId: string }) {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listReviews(issueId);
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleApprove = async (reviewId: string, comment?: string) => {
    try {
      await approveReview(reviewId, comment);
      await loadReviews(); // Refresh data
    } catch (error) {
      console.error("Failed to approve review:", error);
    }
  };

  const handleRequestChanges = async (reviewId: string, comment: string) => {
    try {
      await requestChanges(reviewId, comment);
      await loadReviews(); // Refresh data
    } catch (error) {
      console.error("Failed to request changes:", error);
    }
  };

  const handleCancel = async (reviewId: string) => {
    try {
      await cancelReview(reviewId);
      await loadReviews(); // Refresh data
    } catch (error) {
      console.error("Failed to cancel review:", error);
    }
  };

  const handleToggleChecklist = async (
    reviewId: string,
    index: number,
    done: boolean
  ) => {
    try {
      await toggleChecklist(reviewId, index, done);
      await loadReviews(); // Refresh data
    } catch (error) {
      console.error("Failed to toggle checklist:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-900/50 text-green-300 border border-green-700/50";
      case "changes_requested":
        return "bg-red-900/50 text-red-300 border border-red-700/50";
      case "pending":
        return "bg-yellow-900/50 text-yellow-300 border border-yellow-700/50";
      case "cancelled":
        return "bg-gray-800/50 text-gray-400 border border-gray-700/50";
      default:
        return "bg-gray-800/50 text-gray-400 border border-gray-700/50";
    }
  };

  if (loading) {
    return (
      <section
        id="reviews"
        className="space-y-4 rounded-xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-6"
      >
        <div className="h-6 bg-gray-800/50 animate-pulse rounded"></div>
        <div className="h-32 bg-gray-800/50 animate-pulse rounded"></div>
      </section>
    );
  }

  return (
    <section
      id="reviews"
      className="space-y-4 rounded-xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Reviews</h2>
        <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors border border-blue-500/20">
          Request review
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">
          No reviews requested for this issue.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id as string}
              className="border border-gray-700/50 rounded-xl p-4 bg-gray-800/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      review.status
                    )}`}
                  >
                    {review.status.replace("_", " ")}
                  </span>
                  <span className="text-sm text-gray-400">
                    {review.requiredApprovals} approval
                    {review.requiredApprovals !== 1 ? "s" : ""} required
                  </span>
                  {review.dueDate && (
                    <span className="text-sm text-gray-400">
                      • Due {new Date(review.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCancel(review._id as string)}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Cancel
                </button>
              </div>{" "}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Reviewers
                  </h4>
                  <div className="space-y-2">
                    {review.reviewers.map((reviewer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-800"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {(() => {
                              const user = reviewer.user as
                                | { name?: string }
                                | string;
                              return typeof user === "string"
                                ? "Unknown User"
                                : user.name || "Unknown User";
                            })()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(
                              reviewer.status
                            )}`}
                          >
                            {reviewer.status.replace("_", " ")}
                          </span>
                        </div>
                        {reviewer.status === "pending" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleApprove(review._id as string)
                              }
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const comment = prompt(
                                  "Enter comment for changes:"
                                );
                                if (comment)
                                  handleRequestChanges(
                                    review._id as string,
                                    comment
                                  );
                              }}
                              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            >
                              Request changes
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {review.checklist && review.checklist.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-200 mb-2">
                      Checklist
                    </h4>
                    <div className="space-y-1">
                      {review.checklist.map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={(e) =>
                              handleToggleChecklist(
                                review._id as string,
                                idx,
                                e.target.checked
                              )
                            }
                            className="rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span
                            className={
                              item.done
                                ? "line-through text-gray-500"
                                : "text-gray-200"
                            }
                          >
                            {item.label}
                          </span>
                          {item.done && item.doneBy && (
                            <span className="text-xs text-gray-500">
                              by{" "}
                              {(() => {
                                const user = item.doneBy as
                                  | { name?: string }
                                  | string;
                                return typeof user === "string"
                                  ? "Someone"
                                  : user.name || "Someone";
                              })()}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
