import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb-driver";
import {
  computeSprintKPIs,
  toVelocityStats,
  median,
} from "@/lib/analytics/sprints";
import { AuthUtils } from "@/lib/auth-utils";
import { ObjectId } from "mongodb";

export const revalidate = 900; // 15 min
export const dynamic = "force-dynamic";

function parseFilter(searchParams: URLSearchParams) {
  return {
    from: searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
    status: searchParams.getAll("status"),
    assigneeIds: searchParams.getAll("assigneeIds"),
    labels: searchParams.getAll("labels"),
    epicIds: searchParams.getAll("epicIds"),
  } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const filter = parseFilter(searchParams);

    // Get project
    const project = await db.collection("projects").findOne({ key });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    if (
      currentUser.role !== "admin" &&
      String(project.team) !== String(currentUser.team)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { perSprint, velocity } = await computeSprintKPIs(
      db,
      new ObjectId(project._id),
      filter
    );
    const last5 = velocity.slice(-5);
    const forecastNext = median(last5.length ? last5 : velocity);

    return NextResponse.json({
      sprints: perSprint,
      velocity: toVelocityStats(velocity),
      forecastNextSprintPoints: forecastNext,
    });
  } catch (error) {
    console.error("Error in sprints analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
