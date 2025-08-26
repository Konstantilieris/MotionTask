import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Activity from "@/models/Activity";
import Issue from "@/models/Issue";

// GET /api/issues/[key]/activities - Get all activities for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await connectToDb();
    const { key } = await params;

    // Find issue by key
    const issue = await Issue.findOne({ key });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get activities for this issue, sorted by creation date (newest first)
    const activities = await Activity.find({ issue: issue._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      activities: activities.map((activity: Record<string, unknown>) => ({
        ...activity,
        at: activity.createdAt,
        actor: activity.user, // Map user to actor for frontend compatibility
      })),
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST /api/issues/[key]/activities - Create a new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    await connectToDb();
    const { key } = await params;
    const body = await request.json();

    // Find issue by key
    const issue = await Issue.findOne({ key });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // TODO: Get actual user ID from authentication token/session
    // For now, this will fail until proper auth is implemented
    const userId = null; // Replace with actual user ID from auth

    if (!userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 }
      );
    }

    const activity = await Activity.create({
      issue: issue._id,
      type: body.type,
      user: userId,
      metadata: body.meta || {},
    });

    // Populate the user field
    const populatedActivity = await activity.populate("user", "name email");
    const activityObject = populatedActivity.toObject();

    return NextResponse.json({
      success: true,
      ...activityObject,
      at: activityObject.createdAt,
      actor: activityObject.user, // Map user to actor for frontend compatibility
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
