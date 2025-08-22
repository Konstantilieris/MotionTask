import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import Issue from "@/models/Issue";
import ActivityLog from "@/models/ActivityLog";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WatcherBody = z.object({
  userId: z.string(),
});

async function resolveIssueReference(reference: string) {
  // Try as ObjectId first
  if (Types.ObjectId.isValid(reference)) {
    return await Issue.findById(reference);
  }

  // Try as key
  return await Issue.findOne({ key: reference, deletedAt: null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = WatcherBody.parse(await req.json());
    await connectToDb();

    const issue = await resolveIssueReference(params.key);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Add to watchers (dedupe)
    await Issue.findByIdAndUpdate(issue._id, {
      $addToSet: { watchers: userId },
    });

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      actorId: session.user.id,
      type: "updated",
      at: new Date(),
      meta: {
        action: "watch",
        targetUserId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding watcher:", error);
    return NextResponse.json(
      { error: "Failed to add watcher" },
      { status: 500 }
    );
  }
}
