import { Db, ObjectId } from "mongodb";

export interface SprintKPI {
  sprintId: string;
  key: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  committedPoints: number;
  completedPoints: number;
  addedScopePoints: number;
  removedScopePoints: number;
  spilloverPoints: number;
  commitmentReliability: number;
  throughputIssues: number;
  cycleTimeDays: number;
  leadTimeDays: number;
}

export interface VelocityStats {
  series: number[];
  avg: number;
  median: number;
  last5Avg: number;
  last5Median: number;
}

export interface AnalyticsFilter {
  from?: Date;
  to?: Date;
  status?: string[];
  assigneeIds?: string[];
  labels?: string[];
  epicIds?: string[];
}

interface ChangelogEntry {
  field: string;
  oldValue?: string;
  newValue?: string;
  at: Date;
}

interface SprintDocument {
  _id: ObjectId;
  key?: string;
  name: string;
  number?: number;
  startDate: Date;
  endDate: Date;
  status: string;
  project: ObjectId;
  deletedAt?: Date;
}

interface IssueDocument {
  _id: ObjectId;
  title: string;
  key: string;
  storyPoints?: number;
  sprint?: ObjectId;
  status: string;
  project: ObjectId;
  assignee?: ObjectId;
  labels?: string[];
  epic?: ObjectId;
  createdAt: Date;
  deletedAt?: Date;
  changelog?: ChangelogEntry[];
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function average(values: number[]): number {
  return values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;
}

export function toVelocityStats(velocity: number[]): VelocityStats {
  const last5 = velocity.slice(-5);
  return {
    series: velocity,
    avg: average(velocity),
    median: median(velocity),
    last5Avg: average(last5),
    last5Median: median(last5),
  };
}

export async function computeSprintKPIs(
  db: Db,
  projectId: ObjectId,
  filter: AnalyticsFilter
): Promise<{ perSprint: SprintKPI[]; velocity: number[] }> {
  // Build sprint match criteria
  const sprintMatch: Record<string, unknown> = {
    project: projectId,
    deletedAt: { $exists: false },
  };

  if (filter.from || filter.to) {
    const dateFilter: Record<string, unknown> = {};
    if (filter.from) dateFilter.$gte = filter.from;
    if (filter.to) dateFilter.$lte = filter.to;
    sprintMatch.startDate = dateFilter;
  }

  if (filter.status && filter.status.length > 0) {
    sprintMatch.status = { $in: filter.status };
  }

  // Get sprints
  const sprints = (await db
    .collection("sprints")
    .find(sprintMatch)
    .sort({ startDate: 1 })
    .toArray()) as SprintDocument[];

  const sprintKPIs: SprintKPI[] = [];
  const velocity: number[] = [];

  for (const sprint of sprints) {
    const kpi = await computeSingleSprintKPI(db, sprint, filter);
    sprintKPIs.push(kpi);

    // Only include completed sprints in velocity calculation
    if (sprint.status === "completed") {
      velocity.push(kpi.completedPoints);
    }
  }

  return { perSprint: sprintKPIs, velocity };
}

async function computeSingleSprintKPI(
  db: Db,
  sprint: SprintDocument,
  filter: AnalyticsFilter
): Promise<SprintKPI> {
  const sprintId = sprint._id.toString();
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);

  // Build issue match criteria
  const issueMatch: Record<string, unknown> = {
    project: sprint.project,
    deletedAt: { $exists: false },
  };

  // Apply additional filters
  if (filter.assigneeIds && filter.assigneeIds.length > 0) {
    issueMatch.assignee = {
      $in: filter.assigneeIds.map((id) => new ObjectId(id)),
    };
  }

  if (filter.labels && filter.labels.length > 0) {
    issueMatch.labels = { $in: filter.labels };
  }

  if (filter.epicIds && filter.epicIds.length > 0) {
    issueMatch.epic = { $in: filter.epicIds.map((id) => new ObjectId(id)) };
  }

  // Get all issues that were ever part of this sprint
  const sprintIssues = (await db
    .collection("issues")
    .aggregate([
      {
        $match: {
          ...issueMatch,
          $or: [
            { sprint: sprint._id },
            { "changelog.field": "sprint", "changelog.newValue": sprintId },
          ],
        },
      },
      {
        $addFields: {
          changelog: { $ifNull: ["$changelog", []] },
        },
      },
    ])
    .toArray()) as IssueDocument[];

  let committedPoints = 0;
  let completedPoints = 0;
  let addedScopePoints = 0;
  let removedScopePoints = 0;
  let spilloverPoints = 0;
  let throughputIssues = 0;
  let totalCycleTime = 0;
  let totalLeadTime = 0;
  let cycleTimeCount = 0;
  let leadTimeCount = 0;

  for (const issue of sprintIssues) {
    const storyPoints = issue.storyPoints || 0;

    // Check if issue was committed at sprint start
    const wasCommittedAtStart = await wasIssueInSprintAtDate(
      issue,
      sprintId,
      startDate
    );
    if (wasCommittedAtStart) {
      committedPoints += storyPoints;
    }

    // Check if issue was completed during sprint
    const completedDuringSprintDate = await getIssueCompletionDateInSprint(
      issue,
      startDate,
      endDate
    );
    if (completedDuringSprintDate) {
      completedPoints += storyPoints;
      throughputIssues++;
    } else if (wasCommittedAtStart) {
      // Issue was committed but not completed
      spilloverPoints += storyPoints;
    }

    // Check for scope changes during sprint
    const scopeChanges = await getSprintScopeChanges(
      issue,
      sprintId,
      startDate,
      endDate
    );
    addedScopePoints += scopeChanges.added * storyPoints;
    removedScopePoints += scopeChanges.removed * storyPoints;

    // Calculate cycle time and lead time
    const times = await calculateIssueTimes(issue, startDate, endDate);
    if (times.cycleTime > 0) {
      totalCycleTime += times.cycleTime;
      cycleTimeCount++;
    }
    if (times.leadTime > 0) {
      totalLeadTime += times.leadTime;
      leadTimeCount++;
    }
  }

  const commitmentReliability =
    committedPoints > 0 ? completedPoints / committedPoints : 0;
  const cycleTimeDays =
    cycleTimeCount > 0 ? totalCycleTime / cycleTimeCount : 0;
  const leadTimeDays = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0;

  return {
    sprintId,
    key: sprint.key || `SPRINT-${sprint.number || sprintId.slice(-6)}`,
    name: sprint.name,
    startDate,
    endDate,
    status: sprint.status,
    committedPoints,
    completedPoints,
    addedScopePoints,
    removedScopePoints,
    spilloverPoints,
    commitmentReliability,
    throughputIssues,
    cycleTimeDays,
    leadTimeDays,
  };
}

async function wasIssueInSprintAtDate(
  issue: IssueDocument,
  sprintId: string,
  date: Date
): Promise<boolean> {
  // If current sprint matches, check if it was set before the date
  if (issue.sprint?.toString() === sprintId) {
    // Check changelog to see if it was added after the date
    const sprintChanges =
      issue.changelog?.filter(
        (change: ChangelogEntry) =>
          change.field === "sprint" &&
          change.newValue === sprintId &&
          new Date(change.at) > date
      ) || [];

    // If no changes after the date, it was there at the start
    return sprintChanges.length === 0;
  }

  // Check if it was added and removed before the date
  const relevantChanges =
    issue.changelog
      ?.filter(
        (change: ChangelogEntry) =>
          change.field === "sprint" && new Date(change.at) <= date
      )
      .sort(
        (a: ChangelogEntry, b: ChangelogEntry) =>
          new Date(a.at).getTime() - new Date(b.at).getTime()
      ) || [];

  const lastChange = relevantChanges[relevantChanges.length - 1];
  return lastChange?.newValue === sprintId;
}

async function getIssueCompletionDateInSprint(
  issue: IssueDocument,
  startDate: Date,
  endDate: Date
): Promise<Date | null> {
  const statusChanges =
    issue.changelog?.filter(
      (change: ChangelogEntry) =>
        change.field === "status" &&
        change.newValue === "done" &&
        new Date(change.at) >= startDate &&
        new Date(change.at) <= endDate
    ) || [];

  return statusChanges.length > 0 ? new Date(statusChanges[0].at) : null;
}

async function getSprintScopeChanges(
  issue: IssueDocument,
  sprintId: string,
  startDate: Date,
  endDate: Date
): Promise<{ added: number; removed: number }> {
  const sprintChanges =
    issue.changelog?.filter(
      (change: ChangelogEntry) =>
        change.field === "sprint" &&
        new Date(change.at) > startDate &&
        new Date(change.at) <= endDate
    ) || [];

  let added = 0;
  let removed = 0;

  for (const change of sprintChanges) {
    if (change.newValue === sprintId) {
      added = 1; // Issue was added to sprint
    } else if (change.oldValue === sprintId) {
      removed = 1; // Issue was removed from sprint
    }
  }

  return { added, removed };
}

async function calculateIssueTimes(
  issue: IssueDocument,
  sprintStart: Date,
  sprintEnd: Date
): Promise<{ cycleTime: number; leadTime: number }> {
  let cycleTime = 0;
  let leadTime = 0;

  // Find when issue entered "In Progress" state
  const inProgressChange = issue.changelog?.find(
    (change: ChangelogEntry) =>
      change.field === "status" && change.newValue === "in-progress"
  );

  // Find when issue was completed
  const doneChange = issue.changelog?.find(
    (change: ChangelogEntry) =>
      change.field === "status" &&
      change.newValue === "done" &&
      new Date(change.at) >= sprintStart &&
      new Date(change.at) <= sprintEnd
  );

  if (doneChange) {
    const completionDate = new Date(doneChange.at);

    // Cycle time: from in-progress to done
    if (inProgressChange) {
      const inProgressDate = new Date(inProgressChange.at);
      cycleTime =
        (completionDate.getTime() - inProgressDate.getTime()) /
        (1000 * 60 * 60 * 24);
    }

    // Lead time: from creation to done
    const creationDate = new Date(issue.createdAt);
    leadTime =
      (completionDate.getTime() - creationDate.getTime()) /
      (1000 * 60 * 60 * 24);
  }

  return { cycleTime, leadTime };
}
