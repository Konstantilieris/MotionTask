import mongoose, { Schema, Types, Model, Document } from "mongoose";

/* -------------------------------------------------// Compound unique index that allows duplicate keys for soft-deleted issues
issueSchema.index(
  { key: 1, deletedAt: 1 },
  { 
    unique: true,
    partialFilterExpression: { deletedAt: null },
    background: true
  }
);

issueSchema.index({ project: 1, status: 1, position: 1 });
issueSchema.index({ project: 1, type: 1 }); // For hierarchical queries
issueSchema.index({ parent: 1 }); // For finding subtasks
issueSchema.index({ epic: 1 }); // For finding stories under epic

// Pre-save middleware to handle key generation and avoid duplicates
issueSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      // Check for existing issues with same key that are not soft-deleted
      const existingIssue = await Issue.findOne({ 
        key: this.key, 
        deletedAt: null 
      });
      
      if (existingIssue) {
        const error = new Error(`Issue with key ${this.key} already exists`);
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});-------------
 *  Issue Schema
 * ---------------------------------------------------------------------------*/
export const ISSUE_STATUS = ["backlog", "todo", "in-progress", "done"] as const;
export const ISSUE_TYPE = ["task", "bug", "story", "epic", "subtask"] as const;
export const ISSUE_PRIORITY = ["low", "medium", "high", "critical"] as const;
export const ISSUE_RESOLUTION = [
  "unresolved",
  "done",
  "wont-fix",
  "duplicate",
  "incomplete",
] as const;

export interface ITimeTracking {
  originalEstimate?: number; // minutes
  remainingEstimate?: number; // minutes
  timeSpent?: number; // minutes
}

export interface IAttachment {
  filename: string;
  url: string;
  mimeType?: string;
  size?: number; // bytes
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IIssue extends Document {
  title: string;
  description?: string;
  key: string; // e.g., "PROJ-123"
  issueNumber: number; // Sequential number within project
  status: (typeof ISSUE_STATUS)[number];
  type: (typeof ISSUE_TYPE)[number];
  priority: (typeof ISSUE_PRIORITY)[number];
  position: number;
  rank: string; // LexoRank-style string for efficient ordering
  labels: string[];
  storyPoints?: number;
  dueDate?: Date;
  sprint?: Types.ObjectId; // Reference to Sprint model
  timeTracking: ITimeTracking;
  attachments: IAttachment[];
  linkedIssues: Types.ObjectId[];
  watchers: Types.ObjectId[];
  affectsVersions: string[];
  fixVersions: string[];
  resolution: (typeof ISSUE_RESOLUTION)[number];
  resolutionDate?: Date;
  project: Types.ObjectId;
  reporter: Types.ObjectId;
  assignee?: Types.ObjectId;
  parent?: Types.ObjectId; // for sub‑tasks
  epic?: Types.ObjectId; // link to epic issue
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timeTrackingSchema = new Schema<ITimeTracking>(
  {
    originalEstimate: { type: Number },
    remainingEstimate: { type: Number },
    timeSpent: { type: Number },
  },
  { _id: false }
);

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    key: { type: String, required: true, index: true },
    issueNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ISSUE_STATUS,
      default: "todo",
      index: true,
    },
    type: { type: String, enum: ISSUE_TYPE, default: "task" },
    priority: { type: String, enum: ISSUE_PRIORITY, default: "medium" },
    position: { type: Number, default: 0 },
    rank: { type: String, default: "M", index: true }, // LexoRank for efficient ordering
    labels: [{ type: String }],
    storyPoints: { type: Number },
    dueDate: { type: Date },
    sprint: { type: Schema.Types.ObjectId, ref: "Sprint" },
    timeTracking: { type: timeTrackingSchema, default: {} },
    attachments: [attachmentSchema],
    linkedIssues: [{ type: Schema.Types.ObjectId, ref: "Issue" }],
    watchers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    affectsVersions: [{ type: String }],
    fixVersions: [{ type: String }],
    resolution: {
      type: String,
      enum: ISSUE_RESOLUTION,
      default: "unresolved",
    },
    resolutionDate: { type: Date },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    parent: { type: Schema.Types.ObjectId, ref: "Issue" },
    epic: { type: Schema.Types.ObjectId, ref: "Issue" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound unique index that allows duplicate keys for soft-deleted issues
issueSchema.index(
  { key: 1, deletedAt: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);

issueSchema.index({ project: 1, status: 1, position: 1 });
issueSchema.index({ project: 1, status: 1, rank: 1 }); // For LexoRank ordering
issueSchema.index({ project: 1, type: 1 }); // For hierarchical queries
issueSchema.index({ parent: 1 }); // For finding subtasks
issueSchema.index({ epic: 1 }); // For finding stories under epic

/* ---------------------------------------------------------------------------
 *  Interface Extensions for Static Methods
 * ---------------------------------------------------------------------------*/
interface IIssueModel extends Model<IIssue> {
  findEpicsWithStories(projectId: Types.ObjectId): Promise<IIssue[]>;
  findSubtasks(parentId: Types.ObjectId): Promise<IIssue[]>;
  findByEpic(epicId: Types.ObjectId): Promise<IIssue[]>;
}

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // @ts-expect-error - Mongoose middleware context
  this.where({ deletedAt: null });
}

issueSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

/* ---------------------------------------------------------------------------
 *  Static Methods for Hierarchical Relationships
 * ---------------------------------------------------------------------------*/
issueSchema.statics.findEpicsWithStories = async function (
  projectId: Types.ObjectId
) {
  return this.aggregate([
    {
      $match: {
        project: projectId,
        type: "epic",
        deletedAt: null,
      },
    },
    {
      $lookup: {
        from: "issues",
        localField: "_id",
        foreignField: "epic",
        as: "stories",
        pipeline: [
          {
            $match: {
              deletedAt: null,
              type: { $in: ["story", "task", "bug"] },
            },
          },
          {
            $lookup: {
              from: "issues",
              localField: "_id",
              foreignField: "parent",
              as: "subtasks",
              pipeline: [{ $match: { deletedAt: null } }],
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignee",
        foreignField: "_id",
        as: "assigneeInfo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "reporter",
        foreignField: "_id",
        as: "reporterInfo",
      },
    },
  ]);
};

issueSchema.statics.findSubtasks = async function (parentId: Types.ObjectId) {
  return this.find({ parent: parentId })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .sort({ position: 1 });
};

issueSchema.statics.findByEpic = async function (epicId: Types.ObjectId) {
  return this.find({ epic: epicId })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .sort({ type: 1, position: 1 }); // Stories first, then tasks, then bugs
};

export const Issue: IIssueModel =
  (mongoose.models.Issue as IIssueModel) ||
  (mongoose.model<IIssue>("Issue", issueSchema) as IIssueModel);

export default Issue;
