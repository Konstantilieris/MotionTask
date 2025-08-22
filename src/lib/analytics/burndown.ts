import { Db, ObjectId } from "mongodb";

export interface BurndownPoint {
  day: string;
  ideal: number;
  actual: number;
}

export interface BurndownData {
  sprint: {
    id: string;
    key: string;
    name: string;
    startDate: Date;
    endDate: Date;
  };
  points: BurndownPoint[];
}

interface ChangelogEntry {
  field: string;
  oldValue?: string;
  newValue?: string;
  at: Date;
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

export function dailyRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export async function burndownForSprint(
  db: Db,
  projectKey: string,
  sprintId: string
): Promise<BurndownData> {
  // Get project
  const project = await db.collection("projects").findOne({ key: projectKey });
  if (!project) {
    throw new Error("Project not found");
  }

  // Get sprint
  const sprint = await db.collection("sprints").findOne({
    _id: new ObjectId(sprintId),
    project: project._id,
  });
  if (!sprint) {
    throw new Error("Sprint not found");
  }

  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const days = dailyRange(startDate, endDate);

  // Get all issues that were ever in this sprint
  const issues = (await db
    .collection("issues")
    .find({
      project: project._id,
      $or: [
        { sprint: sprint._id },
        { "changelog.field": "sprint", "changelog.newValue": sprintId },
      ],
      deletedAt: { $exists: false },
    })
    .toArray()) as IssueDocument[];

  // Calculate committed points (issues in sprint at start date)
  let committedPoints = 0;
  for (const issue of issues) {
    if (await wasIssueInSprintAtDate(issue, sprintId, startDate)) {
      committedPoints += issue.storyPoints || 0;
    }
  }

  // Generate burndown points
  const points: BurndownPoint[] = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dayString = day.toISOString().split("T")[0];

    // Ideal burndown (linear)
    const progress = i / (days.length - 1);
    const ideal = Math.round(committedPoints * (1 - progress));

    // Actual remaining points
    let actual = committedPoints;

    // Subtract points for issues completed by this day
    for (const issue of issues) {
      const completionDate = await getIssueCompletionDate(
        issue,
        startDate,
        day
      );
      if (completionDate) {
        actual -= issue.storyPoints || 0;
      }
    }

    // Adjust for scope changes by this day
    for (const issue of issues) {
      const scopeChange = await getScopeChangeByDate(
        issue,
        sprintId,
        startDate,
        day
      );
      actual += scopeChange;
    }

    points.push({
      day: dayString,
      ideal,
      actual: Math.max(0, actual),
    });
  }

  return {
    sprint: {
      id: sprintId,
      key: sprint.key || `SPRINT-${sprint.number || sprintId.slice(-6)}`,
      name: sprint.name,
      startDate,
      endDate,
    },
    points,
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

    return sprintChanges.length === 0;
  }

  // Check changelog for sprint changes before this date
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

async function getIssueCompletionDate(
  issue: IssueDocument,
  sprintStart: Date,
  byDate: Date
): Promise<Date | null> {
  const completionChanges =
    issue.changelog?.filter(
      (change: ChangelogEntry) =>
        change.field === "status" &&
        change.newValue === "done" &&
        new Date(change.at) >= sprintStart &&
        new Date(change.at) <= byDate
    ) || [];

  return completionChanges.length > 0
    ? new Date(completionChanges[0].at)
    : null;
}

async function getScopeChangeByDate(
  issue: IssueDocument,
  sprintId: string,
  sprintStart: Date,
  byDate: Date
): Promise<number> {
  const sprintChanges =
    issue.changelog?.filter(
      (change: ChangelogEntry) =>
        change.field === "sprint" &&
        new Date(change.at) > sprintStart &&
        new Date(change.at) <= byDate
    ) || [];

  let netChange = 0;
  const storyPoints = issue.storyPoints || 0;

  for (const change of sprintChanges) {
    if (change.newValue === sprintId) {
      netChange += storyPoints; // Added to sprint
    } else if (change.oldValue === sprintId) {
      netChange -= storyPoints; // Removed from sprint
    }
  }

  return netChange;
}
