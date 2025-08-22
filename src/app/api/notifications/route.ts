import { NextResponse } from "next/server";
import { NotificationsService } from "@/services/notifications.service";
import { withAuth, AuthenticatedRequest } from "@/middleware/authz";
import connectDB from "@/lib/mongodb";

// GET /api/notifications - Get user's notifications
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const { searchParams } = new URL(req.url!);
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const skip = parseInt(searchParams.get("skip") || "0", 10);

      const notifications = await NotificationsService.getNotifications(
        req.user!._id,
        limit,
        skip
      );

      const unreadCount = await NotificationsService.getUnreadCount(
        req.user!._id
      );

      return NextResponse.json({
        notifications,
        unreadCount,
        pagination: {
          limit,
          skip,
          hasMore: notifications.length === limit,
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

// PATCH /api/notifications - Mark notifications as read
export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();

      const body = await req.json();
      const { notificationIds } = body;

      await NotificationsService.markAsRead(req.user!._id, notificationIds);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return NextResponse.json(
        { error: "Failed to mark notifications as read" },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
