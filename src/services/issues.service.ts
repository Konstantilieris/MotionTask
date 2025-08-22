import { startSession, ClientSession } from "mongoose";
import { Types } from "mongoose";
import Project from "@/models/Project";
import Issue from "@/models/Issue";
import ActivityLog from "@/models/ActivityLog";
import Review from "@/models/Review";
import {
  rankInitial,
  rankBetween,
  needsRenormalization,
  renormalize,
} from "@/utils/ranking";

interface CreateIssueInput {
  project: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  labels?: string[];
  storyPoints?: number;
  epic?: string; // key or ObjectId
  parent?: string; // key or ObjectId
  assignee?: string;
  sprint?: string;
  dueDate?: Date;
}

export class IssuesService {
  /**
   * Atomically allocate the next issue number for a project (concurrency-safe)
   */
  static async allocateIssueNumber(
    projectId: Types.ObjectId | string,
    session?: ClientSession
  ) {
    const useSession = session || (await startSession());
    const shouldEndSession = !session;

    try {
      if (!session) useSession.startTransaction();

      // Atomically increment the project's issue counter
      const project = await Project.findByIdAndUpdate(
        projectId,
        { $inc: { issueCounter: 1 } },
        { new: true, session: useSession }
      );

      if (!project) {
        throw new Error("Project not found");
      }

      const issueNumber = project.issueCounter;
      const key = `${project.key}-${issueNumber}`;

      if (!session) {
        await useSession.commitTransaction();
      }

      return { issueNumber, key };
    } catch (error) {
      if (!session) {
        await useSession.abortTransaction();
      }
      throw error;
    } finally {
      if (shouldEndSession) {
        await useSession.endSession();
      }
    }
  }

  /**
   * Create a new issue with proper defaults and activity logging
   */
  static async createIssue(input: CreateIssueInput, actorId: string) {
    const session = await startSession();

    try {
      session.startTransaction();

      // Resolve epic and parent if provided as keys
      let epicId: Types.ObjectId | undefined;
      let parentId: Types.ObjectId | undefined;

      if (input.epic) {
        const epic = await this.resolveIssueReference(input.epic);
        if (!epic) throw new Error("Epic not found");
        if (epic.type !== "epic")
          throw new Error("Referenced issue is not an epic");
        epicId = epic._id as Types.ObjectId;
      }

      if (input.parent) {
        const parent = await this.resolveIssueReference(input.parent);
        if (!parent) throw new Error("Parent not found");
        if (parent.type === "epic") throw new Error("Parent cannot be an epic");
        parentId = parent._id as Types.ObjectId;
      }

      // Allocate issue number
      const { issueNumber, key } = await this.allocateIssueNumber(
        input.project,
        session
      );

      // Get initial position in backlog
      const position = rankInitial();

      // Create the issue
      const issue = new Issue({
        title: input.title,
        description: input.description,
        key,
        issueNumber,
        status: "backlog",
        type: input.type || "task",
        priority: input.priority || "medium",
        position,
        project: input.project,
        reporter: actorId,
        assignee: input.assignee || null,
        labels: input.labels || [],
        storyPoints: input.storyPoints || null,
        epic: epicId || null,
        parent: parentId || null,
        sprint: input.sprint || null,
        dueDate: input.dueDate || null,
        resolution: "unresolved",
        watchers: [actorId],
        timeTracking: {},
      });

      await issue.save({ session });

      // Log activity
      await ActivityLog.create(
        [
          {
            issueId: issue._id,
            actorId,
            type: "created",
            at: new Date(),
            meta: { title: input.title, key, type: input.type },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Return populated issue
      return await Issue.findById(issue._id)
        .populate("project", "name key")
        .populate("reporter", "name email")
        .populate("assignee", "name email")
        .populate("epic", "key title")
        .populate("parent", "key title");
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Resolve issue reference by key or ObjectId
   */
  static async resolveIssueReference(reference: string) {
    // Try as ObjectId first
    if (Types.ObjectId.isValid(reference)) {
      return await Issue.findById(reference);
    }

    // Try as key
    return await this.getByKey(reference);
  }

  /**
   * Get issue by key
   */
  static async getByKey(key: string) {
    return await Issue.findOne({ key, deletedAt: null })
      .populate("project", "name key")
      .populate("reporter", "name email")
      .populate("assignee", "name email")
      .populate("epic", "key title")
      .populate("parent", "key title")
      .populate("linkedIssues", "key title status");
  }

  /**
   * Search issues by key prefix or title
   */
  static async searchIssues(projectId: string, query: string, limit = 20) {
    const searchRegex = new RegExp(query, "i");

    return await Issue.find({
      project: projectId,
      deletedAt: null,
      $or: [{ key: searchRegex }, { title: searchRegex }],
    })
      .select("key title status type priority")
      .limit(limit)
      .lean();
  }

  /**
   * Move an issue to a new status and position
   */
  static async moveIssue(
    issueId: string,
    {
      status,
      afterId,
      beforeId,
    }: { status: string; afterId?: string; beforeId?: string },
    actorId: string
  ) {
    const session = await startSession();

    try {
      session.startTransaction();

      // Get the issue being moved
      const issue = await Issue.findById(issueId).session(session);
      if (!issue) {
        throw new Error("Issue not found");
      }

      const oldStatus = issue.status;

      // Get neighbors in the target status
      const neighbors = await Issue.find({
        project: issue.project,
        status,
        deletedAt: null,
        _id: { $ne: issueId },
      })
        .sort({ position: 1 })
        .session(session);

      let prevPosition: number | undefined;
      let nextPosition: number | undefined;

      if (afterId) {
        const afterIssue = neighbors.find(
          (n) => (n._id as Types.ObjectId).toString() === afterId
        );
        if (afterIssue) {
          prevPosition = afterIssue.position;
          const afterIndex = neighbors.findIndex(
            (n) => (n._id as Types.ObjectId).toString() === afterId
          );
          nextPosition = neighbors[afterIndex + 1]?.position;
        }
      } else if (beforeId) {
        const beforeIssue = neighbors.find(
          (n) => (n._id as Types.ObjectId).toString() === beforeId
        );
        if (beforeIssue) {
          nextPosition = beforeIssue.position;
          const beforeIndex = neighbors.findIndex(
            (n) => (n._id as Types.ObjectId).toString() === beforeId
          );
          prevPosition = neighbors[beforeIndex - 1]?.position;
        }
      }

      // Calculate new position
      const newPosition = rankBetween(prevPosition, nextPosition);

      // Update the issue
      await Issue.findByIdAndUpdate(
        issueId,
        {
          status,
          position: newPosition,
          ...(status === "done" && issue.resolution === "unresolved"
            ? {
                resolution: "done",
                resolutionDate: new Date(),
              }
            : {}),
          ...(status !== "done" && oldStatus === "done"
            ? {
                resolution: "unresolved",
                resolutionDate: null,
              }
            : {}),
        },
        { session }
      );

      // Log the move
      await ActivityLog.create(
        [
          {
            issueId,
            actorId,
            type: "moved",
            from: oldStatus,
            to: status,
            at: new Date(),
            meta: { newPosition },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Check if renormalization is needed (outside transaction)
      const allPositions = [
        ...neighbors.map((n) => n.position),
        newPosition,
      ].sort((a, b) => a - b);
      if (needsRenormalization(allPositions)) {
        await renormalize(issue.project.toString(), status);
      }

      return await Issue.findById(issueId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Transition issue status with resolution automation and review gate
   */
  static async transitionIssue(
    issueId: string,
    toStatus: string,
    actorId: string
  ) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    // Review gate: Block transition to "Done" if there are pending reviews
    if (toStatus.toLowerCase() === "done") {
      const pendingReviews = await Review.find({
        issue: issueId,
        status: { $in: ["pending", "changes_requested"] },
      });

      if (pendingReviews.length > 0) {
        const pendingCount = pendingReviews.filter(
          (r) => r.status === "pending"
        ).length;
        const changesCount = pendingReviews.filter(
          (r) => r.status === "changes_requested"
        ).length;

        let message = "Cannot transition issue to Done: ";
        if (pendingCount > 0 && changesCount > 0) {
          message += `${pendingCount} pending review(s) and ${changesCount} review(s) requesting changes must be resolved first.`;
        } else if (pendingCount > 0) {
          message += `${pendingCount} pending review(s) must be approved or cancelled first.`;
        } else {
          message += `${changesCount} review(s) requesting changes must be addressed first.`;
        }

        throw new Error(message);
      }
    }

    const fromStatus = issue.status;
    const updates: Record<string, unknown> = { status: toStatus };

    // Resolution automation
    if (toStatus === "done" && issue.resolution === "unresolved") {
      updates.resolution = "done";
      updates.resolutionDate = new Date();
    } else if (fromStatus === "done" && toStatus !== "done") {
      updates.resolution = "unresolved";
      updates.resolutionDate = null;
    }

    await Issue.findByIdAndUpdate(issueId, updates);

    // Log activity
    await ActivityLog.create({
      issueId,
      actorId,
      type: "status-changed",
      from: fromStatus,
      to: toStatus,
      at: new Date(),
    });

    return await Issue.findById(issueId);
  }

  /**
   * Set epic for an issue
   */
  static async setEpic(issueId: string, epicKeyOrId: string, actorId: string) {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new Error("Issue not found");

    const epic = await this.resolveIssueReference(epicKeyOrId);
    if (!epic) throw new Error("Epic not found");
    if (epic.type !== "epic")
      throw new Error("Referenced issue is not an epic");

    const oldEpic = issue.epic;
    issue.epic = epic._id as Types.ObjectId;
    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId,
      actorId,
      type: "updated",
      from: oldEpic?.toString(),
      to: (epic._id as Types.ObjectId).toString(),
      at: new Date(),
      meta: { action: "linked-epic", epicKey: epic.key },
    });

    return await this.getByKey(issue.key);
  }

  /**
   * Set parent for an issue
   */
  static async setParent(
    issueId: string,
    parentKeyOrId: string,
    actorId: string
  ) {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new Error("Issue not found");

    const parent = await this.resolveIssueReference(parentKeyOrId);
    if (!parent) throw new Error("Parent not found");
    if (parent.type === "epic") throw new Error("Parent cannot be an epic");

    // Check for cycles
    await this.validateParentChain(
      issue._id as Types.ObjectId,
      parent._id as Types.ObjectId
    );

    const oldParent = issue.parent;
    issue.parent = parent._id as Types.ObjectId;
    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId,
      actorId,
      type: "updated",
      from: oldParent?.toString(),
      to: (parent._id as Types.ObjectId).toString(),
      at: new Date(),
      meta: { action: "linked-parent", parentKey: parent.key },
    });

    return await this.getByKey(issue.key);
  }

  /**
   * Add linked issue
   */
  static async addLinkedIssue(
    issueId: string,
    otherKeyOrId: string,
    actorId: string
  ) {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new Error("Issue not found");

    const otherIssue = await this.resolveIssueReference(otherKeyOrId);
    if (!otherIssue) throw new Error("Linked issue not found");

    // Add to both issues (bidirectional)
    await Issue.findByIdAndUpdate(issueId, {
      $addToSet: { linkedIssues: otherIssue._id },
    });

    await Issue.findByIdAndUpdate(otherIssue._id, {
      $addToSet: { linkedIssues: issue._id },
    });

    // Log activity
    await ActivityLog.create({
      issueId,
      actorId,
      type: "updated",
      at: new Date(),
      meta: { action: "linked-issue", otherKey: otherIssue.key },
    });

    return await this.getByKey(issue.key);
  }

  /**
   * Remove linked issue
   */
  static async removeLinkedIssue(
    issueId: string,
    otherKeyOrId: string,
    actorId: string
  ) {
    const issue = await Issue.findById(issueId);
    if (!issue) throw new Error("Issue not found");

    const otherIssue = await this.resolveIssueReference(otherKeyOrId);
    if (!otherIssue) throw new Error("Linked issue not found");

    // Remove from both issues
    await Issue.findByIdAndUpdate(issueId, {
      $pull: { linkedIssues: otherIssue._id },
    });

    await Issue.findByIdAndUpdate(otherIssue._id, {
      $pull: { linkedIssues: issue._id },
    });

    // Log activity
    await ActivityLog.create({
      issueId,
      actorId,
      type: "updated",
      at: new Date(),
      meta: { action: "unlinked-issue", otherKey: otherIssue.key },
    });

    return await this.getByKey(issue.key);
  }

  /**
   * Validate parent chain to prevent cycles
   */
  private static async validateParentChain(
    issueId: Types.ObjectId,
    newParentId: Types.ObjectId
  ) {
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

      const parent = await Issue.findById(currentParent)
        .select("parent")
        .lean();
      currentParent = parent?.parent as Types.ObjectId | undefined;
      depth++;
    }

    if (depth >= maxDepth) {
      throw new Error("Parent chain too deep (max 10 levels)");
    }
  }
}
