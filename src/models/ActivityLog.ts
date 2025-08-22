/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
  // Core fields
  type:
    | "created"
    | "updated"
    | "moved"
    | "status-changed"
    | "deleted"
    | "notification";
  at: Date;

  // Issue-related activity
  issueId?: mongoose.Types.ObjectId;

  // Actor (who performed the action)
  actorId?: mongoose.Types.ObjectId;

  // Change tracking
  from?: string;
  to?: string;

  // Notification fields
  userId?: mongoose.Types.ObjectId;
  notificationType?:
    | "issue_created"
    | "issue_updated"
    | "issue_assigned"
    | "issue_mentioned"
    | "comment_added";
  title?: string;
  message?: string;
  read?: boolean;
  readAt?: Date;

  // Additional metadata
  meta?: Record<string, any>;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "moved",
        "status-changed",
        "deleted",
        "notification",
      ],
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    issueId: {
      type: Schema.Types.ObjectId,
      ref: "Issue",
      sparse: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    from: {
      type: String,
      sparse: true,
    },
    to: {
      type: String,
      sparse: true,
    },
    // Notification fields
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    notificationType: {
      type: String,
      enum: [
        "issue_created",
        "issue_updated",
        "issue_assigned",
        "issue_mentioned",
        "comment_added",
      ],
      sparse: true,
    },
    title: {
      type: String,
      sparse: true,
    },
    message: {
      type: String,
      sparse: true,
    },
    read: {
      type: Boolean,
      default: false,
      sparse: true,
    },
    readAt: {
      type: Date,
      sparse: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false, // We use our own 'at' field
  }
);

// Indexes for performance
ActivityLogSchema.index({ issueId: 1, at: -1 });
ActivityLogSchema.index({ actorId: 1, at: -1 });
ActivityLogSchema.index({ userId: 1, type: 1, read: 1 }); // For notifications
ActivityLogSchema.index({ at: -1 }); // For general activity feeds
ActivityLogSchema.index({ type: 1, at: -1 });

// TTL index to automatically delete old logs (optional)
ActivityLogSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }); // 1 year

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
