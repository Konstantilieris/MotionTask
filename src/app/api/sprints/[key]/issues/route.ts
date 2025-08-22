import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Sprint from "@/models/Sprint";
import Issue from "@/models/Issue";
import { AuthUtils } from "@/lib/auth-utils";

// Add issue to sprint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { issueId } = await request.json();
    
    if (!issueId) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const sprint = await Sprint.findById(params.id);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Update issue with sprint reference
    await Issue.findByIdAndUpdate(issueId, { sprint: params.id });

    // Add issue to sprint's issues array if not already present
    if (!sprint.issues.includes(issueId)) {
      sprint.issues.push(issueId);
      await sprint.save();
    }

    return NextResponse.json({ message: "Issue added to sprint successfully" });
  } catch (error) {
    console.error("Error adding issue to sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove issue from sprint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get("issueId");
    
    if (!issueId) {
      return NextResponse.json(
        { error: "Issue ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const sprint = await Sprint.findById(params.id);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Remove sprint reference from issue
    await Issue.findByIdAndUpdate(issueId, { $unset: { sprint: 1 } });

    // Remove issue from sprint's issues array
    sprint.issues = sprint.issues.filter(
      (id) => id.toString() !== issueId
    );
    await sprint.save();

    return NextResponse.json({ message: "Issue removed from sprint successfully" });
  } catch (error) {
    console.error("Error removing issue from sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
