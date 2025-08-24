import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb-driver";
import { cfdForSprint } from "@/lib/analytics/cfd";
import { AuthUtils } from "@/lib/auth-utils";

export const revalidate = 900;
export const dynamic = "force-static";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = await getDb();
    const paramsResolved = await params;
    // Get project to check access
    const project = await db
      .collection("projects")
      .findOne({ key: paramsResolved.key });
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

    const data = await cfdForSprint(
      db,
      paramsResolved.key,
      paramsResolved.sprintId
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in sprint CFD:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
