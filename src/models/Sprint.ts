import mongoose, { Schema, Types, Model, Document } from "mongoose";

/* ---------------------------------------------------------------------------
 *  Sprint Schema
 * ---------------------------------------------------------------------------*/
export const SPRINT_STATUS = ["planned", "active", "completed"] as const;

export interface ISprint extends Document {
  name: string;
  description?: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: (typeof SPRINT_STATUS)[number];
  project: Types.ObjectId;
  team: Types.ObjectId;
  capacity?: number; // story points
  velocity?: number; // completed story points
  issues: Types.ObjectId[]; // issues assigned to this sprint
  createdBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    goal: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: SPRINT_STATUS,
      default: "planned",
      index: true,
    },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    capacity: { type: Number },
    velocity: { type: Number },
    issues: [{ type: Schema.Types.ObjectId, ref: "Issue" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for performance
sprintSchema.index({ project: 1, status: 1 });
sprintSchema.index({ team: 1, status: 1 });
sprintSchema.index({ startDate: 1, endDate: 1 });

// Validation: endDate must be after startDate
sprintSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // @ts-expect-error - Mongoose middleware context
  this.where({ deletedAt: null });
}

sprintSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

export const Sprint: Model<ISprint> =
  mongoose.models.Sprint || mongoose.model<ISprint>("Sprint", sprintSchema);

export default Sprint;
