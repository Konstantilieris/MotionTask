import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IActivity extends Document {
  _id: Types.ObjectId;
  type: "comment" | "updated" | "status-changed" | "assigned" | "created";
  issue: Types.ObjectId;
  user: Types.ObjectId;
  meta: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    [key: string]: unknown;
  };
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ["comment", "updated", "status-changed", "assigned", "created"],
      required: true,
      index: true,
    },
    issue: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ActivitySchema.index({ issue: 1, at: -1 });
ActivitySchema.index({ user: 1, at: -1 });
ActivitySchema.index({ type: 1, at: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
