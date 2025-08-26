import Activity from "@/models/Activity";
import { connectToDb } from "@/lib/db";
import { ClientSession } from "mongoose";

export interface CreateActivityData {
  issueId: string;
  type: "comment" | "updated" | "status-changed" | "assigned" | "created";
  actor: string; // User ID
  meta?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    [key: string]: unknown;
  };
}

export async function createActivity(
  data: CreateActivityData,
  session?: ClientSession
) {
  try {
    if (!session) {
      await connectToDb();
    }

    const activityData = {
      type: data.type,
      issue: data.issueId,
      user: data.actor,
      meta: data.meta || {},
      at: new Date(),
    };

    if (session) {
      const [activity] = await Activity.create([activityData], { session });
      return activity;
    } else {
      return await Activity.create(activityData);
    }
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
}

export async function createIssueCreatedActivity(
  issueId: string,
  creatorId: string,
  session?: ClientSession
) {
  return createActivity(
    {
      issueId,
      type: "created",
      actor: creatorId,
    },
    session
  );
}

export async function createStatusChangeActivity(
  issueId: string,
  actorId: string,
  oldStatus: string,
  newStatus: string,
  session?: ClientSession
) {
  return createActivity(
    {
      issueId,
      type: "status-changed",
      actor: actorId,
      meta: {
        field: "status",
        oldValue: oldStatus,
        newValue: newStatus,
      },
    },
    session
  );
}

export async function createAssignmentActivity(
  issueId: string,
  actorId: string,
  assigneeName: string,
  session?: ClientSession
) {
  return createActivity(
    {
      issueId,
      type: "assigned",
      actor: actorId,
      meta: {
        newValue: assigneeName,
      },
    },
    session
  );
}

export async function createCommentActivity(
  issueId: string,
  actorId: string,
  comment: string,
  session?: ClientSession
) {
  return createActivity(
    {
      issueId,
      type: "comment",
      actor: actorId,
      meta: {
        comment,
      },
    },
    session
  );
}
