import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivity extends Document {
  _id: string;
  issue: string | { _id: string; key: string; title: string };
  type: "comment" | "updated" | "status_changed" | "assigned" | "created";
  user: string | { _id: string; name: string; email: string };
  metadata?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    issue: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Issue",
    },
    type: {
      type: String,
      required: true,
      enum: ["comment", "updated", "status_changed", "assigned", "created"],
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient querying
ActivitySchema.index({ issueId: 1, createdAt: -1 });

// Export the model
export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
