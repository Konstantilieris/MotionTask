import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIssue extends Document {
  _id: string;
  key: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  assignee?: string | { _id: string; name: string; email: string };
  reporter: string | { _id: string; name: string; email: string };
  watchers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "To Do",
    },
    priority: {
      type: String,
      required: true,
      default: "Medium",
    },
    type: {
      type: String,
      required: true,
      default: "Task",
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reporter: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    watchers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes
IssueSchema.index({ key: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ assignee: 1 });

// Export the model
export const Issue: Model<IIssue> =
  mongoose.models.Issue || mongoose.model<IIssue>("Issue", IssueSchema);
