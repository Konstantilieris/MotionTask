import mongoose, { Schema, Types, Model, Document } from "mongoose";
import { IAttachment } from "./Issue";

/* ---------------------------------------------------------------------------
 *  Comment Schema
 * ---------------------------------------------------------------------------*/
export interface IComment extends Document {
  body: string;
  author: Types.ObjectId;
  issue: Types.ObjectId;
  mentions: Types.ObjectId[];
  attachments: IAttachment[];
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

const commentSchema = new Schema<IComment>(
  {
    body: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issue: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attachments: [attachmentSchema],
    editedAt: { type: Date },
    deletedAt: { type: Date, default: null },
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

commentSchema.pre(["find", "findOne", "findOneAndUpdate"], addNotDeletedQuery);

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
