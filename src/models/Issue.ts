import mongoose, { Schema, Types, Model, Document } from "mongoose";

/* ---------------------------------------------------------------------------
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
    key: { type: String, required: true },
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
    rank: { type: String, default: "M" }, // LexoRank for efficient ordering
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

// Partial unique index on key (active issues only)
issueSchema.index(
  { key: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Project-scoped numbering
issueSchema.index({ project: 1, issueNumber: 1 }, { unique: true });

// Ordering index using LexoRank
issueSchema.index({ project: 1, status: 1, rank: 1 });

// Hierarchical queries
issueSchema.index({ project: 1, type: 1 });
issueSchema.index({ parent: 1 });
issueSchema.index({ epic: 1 });

/* ---------------------------------------------------------------------------
 *  Soft-delete safety middleware
 * ---------------------------------------------------------------------------*/
// Default all find queries to { deletedAt: null }
issueSchema.pre(/^find/, function () {
  // @ts-expect-error - Mongoose middleware context typing
  this.where({ deletedAt: null });
});

// Handle aggregate queries to include soft-delete filter
issueSchema.pre("aggregate", function () {
  const pipeline = this.pipeline();
  // @ts-expect-error - PipelineStage typing complexity
  if (!pipeline.some((stage) => stage.$match?.deletedAt !== undefined)) {
    pipeline.unshift({ $match: { deletedAt: null } });
  }
});

/* ---------------------------------------------------------------------------
 *  Hierarchy invariants validation
 * ---------------------------------------------------------------------------*/
issueSchema.pre("validate", function () {
  // type: 'epic' → no parent, no epic
  if (this.type === "epic") {
    if (this.parent) {
      throw new Error("Epic issues cannot have a parent");
    }
    if (this.epic) {
      throw new Error("Epic issues cannot be linked to another epic");
    }
  }

  // type: 'subtask' → must have parent; parent cannot be an epic
  if (this.type === "subtask") {
    if (!this.parent) {
      throw new Error("Subtask must have a parent");
    }
    // Note: We can't validate parent type here without async lookup
    // This should be validated at the service layer
  }

  // type: 'story' → may have epic; must NOT have parent
  if (this.type === "story") {
    if (this.parent) {
      throw new Error("Story issues cannot have a parent");
    }
  }

  // type: 'task'/'bug' → may have parent OR epic, but not both
  if (this.type === "task" || this.type === "bug") {
    if (this.parent && this.epic) {
      throw new Error("Task/Bug issues cannot have both parent and epic");
    }
  }
});

/* ---------------------------------------------------------------------------
 *  Interface Extensions for Static Methods
 * ---------------------------------------------------------------------------*/
interface IIssueModel extends Model<IIssue> {
  findEpicsWithStories(projectId: Types.ObjectId): Promise<IIssue[]>;
  findSubtasks(parentId: Types.ObjectId): Promise<IIssue[]>;
  findByEpic(epicId: Types.ObjectId): Promise<IIssue[]>;
  createIssue(issueData: Partial<IIssue>): Promise<IIssue>;
}

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware (REMOVED - replaced with proper pre hooks above)
 * ---------------------------------------------------------------------------*/

/* ---------------------------------------------------------------------------
 *  Static Methods for Hierarchical Relationships and Error Handling
 * ---------------------------------------------------------------------------*/
issueSchema.statics.createIssue = async function (issueData: Partial<IIssue>) {
  try {
    const issue = new this(issueData);
    return await issue.save();
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      throw new Error("Issue key already exists (active).");
    }
    throw error;
  }
};

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
              project: projectId, // Ensure same project
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
              pipeline: [
                {
                  $match: {
                    project: projectId, // Ensure same project
                    deletedAt: null,
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
              pipeline: [
                {
                  $project: {
                    name: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "reporter",
              foreignField: "_id",
              as: "reporterInfo",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $sort: { rank: 1 },
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
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "reporter",
        foreignField: "_id",
        as: "reporterInfo",
        pipeline: [
          {
            $project: {
              name: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $sort: { rank: 1 },
    },
  ]);
};

issueSchema.statics.findSubtasks = async function (parentId: Types.ObjectId) {
  return this.find({ parent: parentId })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .sort({ rank: 1 }); // Use rank instead of position
};

issueSchema.statics.findByEpic = async function (epicId: Types.ObjectId) {
  return this.find({ epic: epicId })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .sort({ rank: 1 }); // Use rank for consistent ordering, no type sorting
};

export const Issue: IIssueModel =
  (mongoose.models.Issue as IIssueModel) ||
  (mongoose.model<IIssue>("Issue", issueSchema) as IIssueModel);

export default Issue;
