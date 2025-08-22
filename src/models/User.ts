import mongoose, { Schema, Types, Model, Document } from "mongoose";
export const ROLE = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  oauthProvider?: string;
  image?: string;
  role: Role;
  team: Types.ObjectId;
  phone?: string;
  locale?: string;
  timeZone?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Notification preferences
  notificationPreferences?: {
    email?: {
      issue_created?: boolean;
      issue_updated?: boolean;
      issue_assigned?: boolean;
      issue_mentioned?: boolean;
      comment_added?: boolean;
    };
    realTime?: boolean;
    inApp?: boolean;
  };
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String },
    oauthProvider: { type: String },
    image: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.MEMBER,
    },
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    phone: { type: String },
    locale: { type: String, default: "en" },
    timeZone: { type: String },
    active: { type: Boolean, default: true, index: true },
    lastLogin: { type: Date },

    // Notification preferences
    notificationPreferences: {
      email: {
        issue_created: { type: Boolean, default: true },
        issue_updated: { type: Boolean, default: true },
        issue_assigned: { type: Boolean, default: true },
        issue_mentioned: { type: Boolean, default: true },
        comment_added: { type: Boolean, default: true },
      },
      realTime: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

/* ---------------------------------------------------------------------------
 *  Utility – Soft-delete middleware
 * ---------------------------------------------------------------------------*/
function addNotDeletedQuery() {
  // @ts-expect-error - Mongoose middleware context
  this.where({ deletedAt: null });
}

userSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
