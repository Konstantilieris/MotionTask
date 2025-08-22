"use client";
import { useEffect, useState } from "react";
import { listReviews } from "@/lib/api/reviews";
import type { IReview } from "@/models/Review";

export default function ReviewsBanner({ issueId }: { issueId: string }) {
  const [reviews, setReviews] = useState<IReview[] | null>(null);

  useEffect(() => {
    listReviews(issueId)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [issueId]);

  if (!reviews || reviews.length === 0) return null;

  const openReviews = reviews.filter(
    (r) => r.status !== "approved" && r.status !== "cancelled"
  );
  if (openReviews.length === 0) return null;

  const latest = openReviews[0];
  const required = latest.requiredApprovals;
  const approvals = latest.reviewers.filter(
    (r) => r.status === "approved"
  ).length;
  const pendingReviewers = latest.reviewers.filter(
    (r) => r.status === "pending"
  );

  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 backdrop-blur-sm p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-amber-400">🔒</span>
          <strong className="text-amber-200">
            Reviews required: {approvals}/{required} approvals
          </strong>
        </div>
        <a
          href="#reviews"
          className="text-amber-300 underline hover:text-amber-200 transition-colors"
        >
          Open reviews
        </a>
      </div>
      {pendingReviewers.length > 0 && (
        <div className="mt-2 text-amber-300">
          Pending:{" "}
          {pendingReviewers
            .map((r) => {
              const user = r.user as { name?: string } | string;
              return typeof user === "string"
                ? "Someone"
                : user.name || "Someone";
            })
            .join(", ")}
        </div>
      )}
    </div>
  );
}
