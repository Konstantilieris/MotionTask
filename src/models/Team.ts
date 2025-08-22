import mongoose, { Schema, Types, Model, Document } from "mongoose";
import { Role, ROLE } from "./User";

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
    name: { type: String, required: true, unique: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
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

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.where({ deletedAt: null });
}

teamSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema);

export default Team;
