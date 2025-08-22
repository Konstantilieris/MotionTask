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

const ParentBody = z.object({
  parent: z.string().nullable(),
});

async function resolveIssueReference(reference: string) {
  // Try as ObjectId first
  if (Types.ObjectId.isValid(reference)) {
    return await Issue.findById(reference);
  }

  // Try as key
  return await Issue.findOne({ key: reference, deletedAt: null });
}

async function validateParentChain(
  issueId: Types.ObjectId,
  newParentId: Types.ObjectId
): Promise<void> {
  const visited = new Set<string>();
  let currentParent: Types.ObjectId | undefined = newParentId;
  let depth = 0;
  const maxDepth = 10;

  while (currentParent && depth < maxDepth) {
    const parentId = currentParent.toString();

    if (parentId === issueId.toString()) {
      throw new Error("Circular parent relationship detected");
    }

    if (visited.has(parentId)) {
      throw new Error("Circular parent relationship detected");
    }

    visited.add(parentId);

    const parent = await Issue.findById(currentParent).select("parent").lean();
    currentParent = parent?.parent as Types.ObjectId | undefined;
    depth++;
  }

  if (depth >= maxDepth) {
    throw new Error("Parent chain too deep (max 10 levels)");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { parent } = ParentBody.parse(await req.json());
    await connectToDb();

    const issue = await resolveIssueReference(params.key);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    let parentDoc = null;
    if (parent) {
      parentDoc = await resolveIssueReference(parent);
      if (!parentDoc) {
        return NextResponse.json(
          { error: "Parent not found" },
          { status: 400 }
        );
      }
      if (parentDoc.type === "epic") {
        return NextResponse.json(
          { error: "Parent cannot be an epic" },
          { status: 400 }
        );
      }
      if (
        (parentDoc._id as Types.ObjectId).toString() ===
        (issue._id as Types.ObjectId).toString()
      ) {
        return NextResponse.json(
          { error: "Issue cannot be its own parent" },
          { status: 400 }
        );
      }

      // Check for cycles
      await validateParentChain(
        issue._id as Types.ObjectId,
        parentDoc._id as Types.ObjectId
      );
    }

    const oldParent = issue.parent;
    issue.parent = (parentDoc?._id as Types.ObjectId) || undefined;
    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      actorId: session.user.id,
      type: "updated",
      from: oldParent?.toString(),
      to: parentDoc?._id?.toString(),
      at: new Date(),
      meta: {
        action: "linked-parent",
        parentKey: parentDoc?.key,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting parent:", error);
    const message =
      error instanceof Error ? error.message : "Failed to set parent";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
