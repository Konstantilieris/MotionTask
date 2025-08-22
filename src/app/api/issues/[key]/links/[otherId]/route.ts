import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDb } from "@/lib/db";
import Issue from "@/models/Issue";
import ActivityLog from "@/models/ActivityLog";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveIssueReference(reference: string) {
  // Try as ObjectId first
  if (Types.ObjectId.isValid(reference)) {
    return await Issue.findById(reference);
  }

  // Try as key
  return await Issue.findOne({ key: reference, deletedAt: null });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { key: string; otherId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();

    const issue = await resolveIssueReference(params.key);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const otherIssue = await resolveIssueReference(params.otherId);
    if (!otherIssue) {
      return NextResponse.json(
        { error: "Linked issue not found" },
        { status: 400 }
      );
    }

    // Remove from both issues
    await Issue.findByIdAndUpdate(issue._id, {
      $pull: { linkedIssues: otherIssue._id },
    });

    await Issue.findByIdAndUpdate(otherIssue._id, {
      $pull: { linkedIssues: issue._id },
    });

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      actorId: session.user.id,
      type: "updated",
      at: new Date(),
      meta: {
        action: "unlinked-issue",
        otherKey: otherIssue.key,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking issue:", error);
    return NextResponse.json(
      { error: "Failed to unlink issue" },
      { status: 500 }
    );
  }
}
