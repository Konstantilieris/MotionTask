import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import { AuthUtils } from "@/lib/auth-utils";

// Get hierarchical view of issues (epics with stories and subtasks)
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();

    // Find the project first
    const project = await Issue.findOne({ key: params.key })
      .populate("project")
      .select("project");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all epics with their stories and subtasks
    const epicsWithHierarchy = await Issue.findEpicsWithStories(
      project.project
    );

    return NextResponse.json(epicsWithHierarchy);
  } catch (error) {
    console.error("Error fetching hierarchical issues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
