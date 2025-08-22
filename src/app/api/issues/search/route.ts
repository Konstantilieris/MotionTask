import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDb } from "@/lib/db";
import Issue from "@/models/Issue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SearchBody = z.object({
  projectId: z.string(),
  q: z.string(),
  limit: z.number().int().positive().optional().default(20),
});

export async function POST(req: NextRequest) {
  try {
    const { projectId, q, limit } = SearchBody.parse(await req.json());
    await connectToDb();

    const searchRegex = new RegExp(q, "i");

    const issues = await Issue.find({
      project: projectId,
      deletedAt: null,
      $or: [{ key: searchRegex }, { title: searchRegex }],
    })
      .select("_id key title type status")
      .limit(limit)
      .lean();

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Error searching issues:", error);
    return NextResponse.json(
      { error: "Failed to search issues" },
      { status: 500 }
    );
  }
}
