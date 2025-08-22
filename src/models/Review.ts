import mongoose, { Schema, Types, Model, Document } from "mongoose";

/* ---------------------------------------------------------------------------
 *  Review Schema
 * ---------------------------------------------------------------------------*/
export const REVIEW_STATUS = [
  "pending",
  "approved",
  "changes_requested",
  "cancelled",
  "expired",
] as const;

export interface IReviewerStatus extends Document {
  user: Types.ObjectId;
  status: (typeof REVIEW_STATUS)[number];
  comment?: string;
  actedAt?: Date;
}

export interface IChecklistItem extends Document {
  label: string;
  done: boolean;
  doneBy?: Types.ObjectId;
  doneAt?: Date;
}

export interface IReview extends Document {
  issue: Types.ObjectId;
  requestedBy: Types.ObjectId;
  reviewers: IReviewerStatus[];
  requiredApprovals: number;
  dueDate?: Date;
  checklist?: IChecklistItem[];
  status: (typeof REVIEW_STATUS)[number];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  computeStatus(): (typeof REVIEW_STATUS)[number];
}

const reviewerStatusSchema = new Schema<IReviewerStatus>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: "pending",
    },
    comment: { type: String },
    actedAt: { type: Date },
  },
  { _id: false }
);

const checklistItemSchema = new Schema<IChecklistItem>(
  {
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
    doneBy: { type: Schema.Types.ObjectId, ref: "User" },
    doneAt: { type: Date },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewers: [reviewerStatusSchema],
    requiredApprovals: { type: Number, default: 1, min: 1 },
    dueDate: { type: Date },
    checklist: [checklistItemSchema],
    status: {
      type: String,
      enum: REVIEW_STATUS,
      default: "pending",
      index: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for performance
reviewSchema.index({ issue: 1, status: 1 });

// Method to compute overall status
reviewSchema.methods.computeStatus =
  function (): (typeof REVIEW_STATUS)[number] {
    const approvals = this.reviewers.filter(
      (r: IReviewerStatus) => r.status === "approved"
    ).length;
    const hasChangesRequested = this.reviewers.some(
      (r: IReviewerStatus) => r.status === "changes_requested"
    );

    if (hasChangesRequested) return "changes_requested";
    return approvals >= this.requiredApprovals ? "approved" : "pending";
  };

// Pre-save middleware to update status
reviewSchema.pre("save", function (next) {
  if (this.status !== "cancelled" && this.status !== "expired") {
    this.status = this.computeStatus();
  }
  next();
});

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
