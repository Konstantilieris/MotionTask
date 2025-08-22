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

const LinkBody = z.object({
  other: z.string(),
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

    const { other } = LinkBody.parse(await req.json());
    await connectToDb();

    const issue = await resolveIssueReference(params.key);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const otherIssue = await resolveIssueReference(other);
    if (!otherIssue) {
      return NextResponse.json(
        { error: "Linked issue not found" },
        { status: 400 }
      );
    }

    // Add to both issues (bidirectional)
    await Issue.findByIdAndUpdate(issue._id, {
      $addToSet: { linkedIssues: otherIssue._id },
    });

    await Issue.findByIdAndUpdate(otherIssue._id, {
      $addToSet: { linkedIssues: issue._id },
    });

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      actorId: session.user.id,
      type: "updated",
      at: new Date(),
      meta: {
        action: "linked-issue",
        otherKey: otherIssue.key,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking issue:", error);
    return NextResponse.json(
      { error: "Failed to link issue" },
      { status: 500 }
    );
  }
}
