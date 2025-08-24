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

const EpicBody = z.object({
  epic: z.string().nullable(),
});

async function resolveIssueReference(reference: string) {
  // Try as ObjectId first
  if (Types.ObjectId.isValid(reference)) {
    return await Issue.findById(reference);
  }

  // Try as key
  return await Issue.findOne({ key: reference, deletedAt: null });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { epic } = EpicBody.parse(await req.json());
    await connectToDb();

    const resolvedParams = await params;
    const issue = await resolveIssueReference(resolvedParams.key);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    let epicDoc = null;
    if (epic) {
      epicDoc = await resolveIssueReference(epic);
      if (!epicDoc) {
        return NextResponse.json({ error: "Epic not found" }, { status: 400 });
      }
      if (epicDoc.type !== "epic") {
        return NextResponse.json(
          { error: "Referenced issue is not an epic" },
          { status: 400 }
        );
      }
    }

    const oldEpic = issue.epic;
    issue.epic = (epicDoc?._id as Types.ObjectId) || undefined;
    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      actorId: session.user.id,
      type: "updated",
      from: oldEpic?.toString(),
      to: epicDoc?._id?.toString(),
      at: new Date(),
      meta: {
        action: "linked-epic",
        epicKey: epicDoc?.key,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting epic:", error);
    return NextResponse.json({ error: "Failed to set epic" }, { status: 500 });
  }
}
