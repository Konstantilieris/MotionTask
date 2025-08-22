import Review, {
  IReview,
  IReviewerStatus,
  REVIEW_STATUS,
} from "@/models/Review";
import ActivityLog from "@/models/ActivityLog";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";

export interface CreateReviewParams {
  issueId: string;
  requestedBy: string;
  reviewers: string[];
  requiredApprovals?: number;
  dueDate?: Date;
  checklist?: Array<{ label: string }>;
}

export interface ReviewerActionParams {
  reviewId: string;
  actorId: string;
  comment?: string;
}

export class ReviewsService {
  /**
   * Create a new review for an issue
   */
  static async createReview(params: CreateReviewParams): Promise<IReview> {
    await connectDB();

    const reviewData = {
      issue: new Types.ObjectId(params.issueId),
      requestedBy: new Types.ObjectId(params.requestedBy),
      reviewers: params.reviewers.map((userId) => ({
        user: new Types.ObjectId(userId),
        status: "pending" as const,
      })),
      requiredApprovals: params.requiredApprovals || 1,
      dueDate: params.dueDate,
      checklist: params.checklist?.map((item) => ({
        label: item.label,
        done: false,
      })),
    };

    const review = new Review(reviewData);
    await review.save();

    // Log activity
    await this._saveActivity(
      params.issueId,
      params.requestedBy,
      "review:requested",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        reviewers: params.reviewers,
        requiredApprovals: params.requiredApprovals || 1,
      }
    );

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * List all reviews for an issue
   */
  static async listForIssue(issueId: string): Promise<IReview[]> {
    await connectDB();

    return Review.find({
      issue: issueId,
      deletedAt: null,
    })
      .populate([
        { path: "requestedBy", select: "name email" },
        { path: "reviewers.user", select: "name email" },
        { path: "checklist.doneBy", select: "name email" },
      ])
      .sort({ createdAt: -1 });
  }

  /**
   * Approve a review
   */
  static async approve(params: ReviewerActionParams): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(params.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.status === "cancelled" || review.status === "expired") {
      throw new Error("Cannot approve a cancelled or expired review");
    }

    const updatedReview = await this._setReviewerStatus(
      review,
      params.actorId,
      "approved",
      params.comment
    );

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      params.actorId,
      "review:approved",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        comment: params.comment,
      }
    );

    return updatedReview;
  }

  /**
   * Request changes on a review
   */
  static async requestChanges(params: ReviewerActionParams): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(params.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (review.status === "cancelled" || review.status === "expired") {
      throw new Error(
        "Cannot request changes on a cancelled or expired review"
      );
    }

    const updatedReview = await this._setReviewerStatus(
      review,
      params.actorId,
      "changes_requested",
      params.comment
    );

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      params.actorId,
      "review:changes_requested",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        comment: params.comment,
      }
    );

    return updatedReview;
  }

  /**
   * Cancel a review
   */
  static async cancel(params: ReviewerActionParams): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(params.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // TODO: Add proper auth check - only requester or project admin
    // For now, just check if it's the requester
    if (review.requestedBy.toString() !== params.actorId) {
      throw new Error("Only the review requester can cancel a review");
    }

    review.status = "cancelled";
    await review.save();

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      params.actorId,
      "review:cancelled",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
      }
    );

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * Add a reviewer to an existing review
   */
  static async addReviewer(
    reviewId: string,
    userId: string,
    actorId: string
  ): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Check if user is already a reviewer
    const existingReviewer = review.reviewers.find(
      (r) => r.user.toString() === userId
    );
    if (existingReviewer) {
      throw new Error("User is already a reviewer");
    }

    review.reviewers.push({
      user: new Types.ObjectId(userId),
      status: "pending",
    } as IReviewerStatus);

    await review.save();

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      actorId,
      "review:reviewer_added",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        addedUserId: userId,
      }
    );

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * Remove a reviewer from an existing review
   */
  static async removeReviewer(
    reviewId: string,
    userId: string,
    actorId: string
  ): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    const reviewerIndex = review.reviewers.findIndex(
      (r) => r.user.toString() === userId
    );
    if (reviewerIndex === -1) {
      throw new Error("User is not a reviewer");
    }

    review.reviewers.splice(reviewerIndex, 1);
    await review.save();

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      actorId,
      "review:reviewer_removed",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        removedUserId: userId,
      }
    );

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * Toggle checklist item
   */
  static async toggleChecklistItem(
    reviewId: string,
    itemIndex: number,
    done: boolean,
    actorId: string
  ): Promise<IReview> {
    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    if (
      !review.checklist ||
      itemIndex >= review.checklist.length ||
      itemIndex < 0
    ) {
      throw new Error("Invalid checklist item index");
    }

    const item = review.checklist[itemIndex];
    item.done = done;

    if (done) {
      item.doneBy = new Types.ObjectId(actorId);
      item.doneAt = new Date();
    } else {
      item.doneBy = undefined;
      item.doneAt = undefined;
    }

    await review.save();

    // Log activity
    await this._saveActivity(
      review.issue.toString(),
      actorId,
      "review:checklist_toggled",
      {
        reviewId: (review._id as Types.ObjectId).toString(),
        itemIndex,
        itemLabel: item.label,
        done,
      }
    );

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * Helper: Set reviewer status and update timestamps
   */
  private static async _setReviewerStatus(
    review: IReview,
    actorId: string,
    status: (typeof REVIEW_STATUS)[number],
    comment?: string
  ): Promise<IReview> {
    const reviewer = review.reviewers.find(
      (r) => r.user.toString() === actorId
    );
    if (!reviewer) {
      throw new Error("Only assigned reviewers can perform this action");
    }

    reviewer.status = status;
    reviewer.comment = comment;
    reviewer.actedAt = new Date();

    await review.save();

    return review.populate([
      { path: "requestedBy", select: "name email" },
      { path: "reviewers.user", select: "name email" },
      { path: "checklist.doneBy", select: "name email" },
    ]);
  }

  /**
   * Helper: Save activity log entry
   */
  private static async _saveActivity(
    issueId: string,
    actorId: string,
    type: string,
    meta: Record<string, unknown>
  ): Promise<void> {
    try {
      await ActivityLog.create({
        issue: new Types.ObjectId(issueId),
        user: new Types.ObjectId(actorId),
        type,
        metadata: meta,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to save activity log:", error);
      // Don't throw - activity logging shouldn't break the main operation
    }
  }

  /**
   * Utility function for external use
   */
  static computeOverallStatus(review: IReview): (typeof REVIEW_STATUS)[number] {
    const approvals = review.reviewers.filter(
      (r) => r.status === "approved"
    ).length;
    if (review.reviewers.some((r) => r.status === "changes_requested"))
      return "changes_requested";
    return approvals >= review.requiredApprovals ? "approved" : "pending";
  }

  /**
   * Utility function for external use
   */
  static assertIsReviewer(review: IReview, userId: string) {
    const reviewer = review.reviewers.find((x) => String(x.user) === userId);
    if (!reviewer)
      throw new Error("Only assigned reviewers can perform this action");
    return reviewer;
  }
}
