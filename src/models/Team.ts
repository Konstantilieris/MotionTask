import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { Role, ROLE } from "@/types/roles";

/* ---------------------------------------------------------------------------
 *  Team Schema
 * ---------------------------------------------------------------------------*/
export interface ITeam extends Document {
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  defaultRole: Role;
  members: Types.ObjectId[];
  deletedAt?: Date | null;
  createdAt: Date;

  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String },
    avatar: { type: String },
    defaultRole: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.MEMBER,
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Soft-delete-friendly unique indexes
teamSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
teamSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.where({ deletedAt: null });
}

teamSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

// Aggregate middleware for soft-delete
teamSchema.pre("aggregate", function () {
  const pipeline = this.pipeline();
  if (
    !pipeline.some(
      (stage) =>
        typeof (stage as { $match?: unknown }).$match !== "undefined" &&
        (stage as { $match?: { deletedAt?: unknown } }).$match?.deletedAt !==
          undefined
    )
  ) {
    pipeline.unshift({ $match: { deletedAt: null } });
  }
});

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema);

export default Team;
