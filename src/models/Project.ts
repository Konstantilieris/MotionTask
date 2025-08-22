import mongoose, { Schema, Types, Model, Document } from "mongoose";

/* ---------------------------------------------------------------------------
 *  Project Schema (Jira board)
 * ---------------------------------------------------------------------------*/
export interface IProject extends Document {
  name: string;
  key: string;
  description?: string;
  category?: string;
  avatar?: string;
  startDate?: Date;
  endDate?: Date;
  archived: boolean;
  components: string[];
  team: Types.ObjectId;
  lead: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Issue management
  issueCounter: number;

  // Access control
  owner?: Types.ObjectId;
  isPublic?: boolean;
  members?: Array<{
    user: Types.ObjectId;
    role: "viewer" | "member" | "admin";
    joinedAt: Date;
  }>;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 10,
      trim: true,
    },
    description: { type: String },
    category: { type: String },
    avatar: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    archived: { type: Boolean, default: false, index: true },
    components: [{ type: String }],
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    lead: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },

    // Issue management
    issueCounter: { type: Number, default: 0 },

    // Access control
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: false },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: {
          type: String,
          enum: ["viewer", "member", "admin"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ key: 1, team: 1 }, { unique: true });

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // @ts-expect-error - Mongoose middleware context
  this.where({ deletedAt: null });
}

projectSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

export default Project;
