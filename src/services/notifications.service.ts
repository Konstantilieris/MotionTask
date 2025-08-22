import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";
import { pusher } from "@/lib/pusher"; // Assuming we have Pusher setup

interface NotificationData {
  userId: string;
  type:
    | "issue_created"
    | "issue_updated"
    | "issue_assigned"
    | "issue_mentioned"
    | "comment_added";
  title: string;
  message: string;
  issueKey?: string;
  issueId?: string;
  actorId?: string;
  meta?: Record<string, unknown>;
}

interface EmailNotificationData extends NotificationData {
  userEmail: string;
  userName: string;
  actorName?: string;
}

export class NotificationsService {
  /**
   * Send notification to user
   */
  static async sendNotification(data: NotificationData) {
    try {
      // Get user preferences
      const user = await User.findById(data.userId).select(
        "notificationPreferences email name"
      );
      if (!user) return;

      const preferences = user.notificationPreferences || {};

      // Real-time notification via Pusher
      if (preferences.realTime !== false) {
        await this.sendRealTimeNotification(data);
      }

      // Email notification
      if (preferences.email && preferences.email[data.type] !== false) {
        const actorName = data.actorId
          ? (await User.findById(data.actorId).select("name"))?.name
          : undefined;

        await this.sendEmailNotification({
          ...data,
          userEmail: user.email,
          userName: user.name,
          actorName,
        });
      }

      // In-app notification (store in database)
      if (preferences.inApp !== false) {
        await this.createInAppNotification(data);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      // Don't throw - notifications should not break main operations
    }
  }

  /**
   * Send real-time notification via Pusher
   */
  private static async sendRealTimeNotification(data: NotificationData) {
    try {
      await pusher.trigger(`user-${data.userId}`, "notification", {
        type: data.type,
        title: data.title,
        message: data.message,
        issueKey: data.issueKey,
        timestamp: new Date().toISOString(),
        meta: data.meta,
      });
    } catch (error) {
      console.error("Failed to send real-time notification:", error);
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(data: EmailNotificationData) {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log("Email notification:", {
      to: data.userEmail,
      subject: data.title,
      body: data.message,
      issueKey: data.issueKey,
      actor: data.actorName,
    });

    // Example integration with email service:
    // await emailService.send({
    //   to: data.userEmail,
    //   template: 'issue-notification',
    //   data: {
    //     userName: data.userName,
    //     title: data.title,
    //     message: data.message,
    //     issueKey: data.issueKey,
    //     actorName: data.actorName,
    //     issueUrl: data.issueKey ? `${process.env.BASE_URL}/issues/${data.issueKey}` : undefined
    //   }
    // });
  }

  /**
   * Create in-app notification
   */
  private static async createInAppNotification(data: NotificationData) {
    // You would have a Notification model for this
    // For now, we'll use ActivityLog as a simple storage
    await ActivityLog.create({
      type: "notification",
      userId: data.userId,
      notificationType: data.type,
      title: data.title,
      message: data.message,
      issueId: data.issueId,
      actorId: data.actorId,
      meta: data.meta,
      read: false,
      at: new Date(),
    });
  }

  /**
   * Notify watchers of an issue
   */
  static async notifyWatchers(
    issueId: string,
    type: NotificationData["type"],
    actorId: string,
    data: Partial<NotificationData>
  ) {
    try {
      const Issue = (await import("@/models/Issue")).default;
      const issue = await Issue.findById(issueId)
        .populate("watchers", "_id")
        .populate("assignee", "_id")
        .select("key title watchers assignee");

      if (!issue) return;

      const watcherIds =
        issue.watchers?.map((w: { _id: unknown }) =>
          (w._id as { toString: () => string }).toString()
        ) || [];
      const assigneeId = issue.assignee?._id?.toString();

      // Include assignee if not already a watcher
      const notifyIds = new Set(watcherIds);
      if (assigneeId) notifyIds.add(assigneeId);

      // Don't notify the actor
      notifyIds.delete(actorId);

      // Send notifications to all watchers
      const notifications = Array.from(notifyIds).map((userId) =>
        this.sendNotification({
          userId,
          type,
          title: data.title || `Issue ${issue.key} updated`,
          message: data.message || `${issue.title} has been updated`,
          issueKey: issue.key,
          issueId: issueId,
          actorId,
          meta: data.meta,
        })
      );

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error("Failed to notify watchers:", error);
    }
  }

  /**
   * Notify assignee when issue is assigned
   */
  static async notifyAssignment(
    issueId: string,
    assigneeId: string,
    actorId: string
  ) {
    if (assigneeId === actorId) return; // Don't notify self-assignment

    try {
      const Issue = (await import("@/models/Issue")).default;
      const issue = await Issue.findById(issueId).select("key title");
      if (!issue) return;

      await this.sendNotification({
        userId: assigneeId,
        type: "issue_assigned",
        title: `You've been assigned to ${issue.key}`,
        message: `${issue.title} has been assigned to you`,
        issueKey: issue.key,
        issueId,
        actorId,
      });
    } catch (error) {
      console.error("Failed to notify assignment:", error);
    }
  }

  /**
   * Notify mentioned users in comments
   */
  static async notifyMentions(
    issueId: string,
    mentionedUserIds: string[],
    actorId: string,
    commentText: string
  ) {
    try {
      const Issue = (await import("@/models/Issue")).default;
      const issue = await Issue.findById(issueId).select("key title");
      if (!issue) return;

      const notifications = mentionedUserIds
        .filter((userId) => userId !== actorId) // Don't notify self
        .map((userId) =>
          this.sendNotification({
            userId,
            type: "issue_mentioned",
            title: `You were mentioned in ${issue.key}`,
            message: `You were mentioned in a comment on ${issue.title}`,
            issueKey: issue.key,
            issueId,
            actorId,
            meta: { comment: commentText.substring(0, 200) },
          })
        );

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error("Failed to notify mentions:", error);
    }
  }

  /**
   * Get user's unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await ActivityLog.countDocuments({
        userId,
        type: "notification",
        read: false,
      });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds?: string[]) {
    try {
      const filter: Record<string, unknown> = {
        userId,
        type: "notification",
        read: false,
      };

      if (notificationIds?.length) {
        filter._id = { $in: notificationIds };
      }

      await ActivityLog.updateMany(filter, {
        read: true,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }

  /**
   * Get user's recent notifications
   */
  static async getNotifications(userId: string, limit = 20, skip = 0) {
    try {
      return await ActivityLog.find({
        userId,
        type: "notification",
      })
        .sort({ at: -1 })
        .limit(limit)
        .skip(skip)
        .populate("actorId", "name email")
        .lean();
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return [];
    }
  }
}
