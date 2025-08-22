import { Db, ObjectId } from "mongodb";
import { dailyRange } from "./burndown";

export interface CFDDay {
  day: string;
  [status: string]: string | number;
}

export interface CFDData {
  buckets: string[];
  days: CFDDay[];
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

export async function cfdForSprint(
  db: Db,
  projectKey: string,
  sprintId: string
): Promise<CFDData> {
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

  // Define status buckets
  const buckets = ["todo", "in-progress", "review", "done"];
  const cfdDays: CFDDay[] = [];

  for (const day of days) {
    const dayString = day.toISOString().split("T")[0];
    const dayData: CFDDay = { day: dayString };

    // Initialize all buckets to 0
    for (const bucket of buckets) {
      dayData[bucket] = 0;
    }

    // Count story points in each status for this day
    for (const issue of issues) {
      // Check if issue was in sprint on this day
      const wasInSprint = await wasIssueInSprintAtDate(issue, sprintId, day);
      if (wasInSprint) {
        const statusAtDay = await getIssueStatusAtDate(issue, day);
        const storyPoints = issue.storyPoints || 0;

        if (buckets.includes(statusAtDay)) {
          dayData[statusAtDay] = (dayData[statusAtDay] as number) + storyPoints;
        } else {
          // Map other statuses to closest bucket
          const mappedStatus = mapStatusToBucket(statusAtDay);
          if (buckets.includes(mappedStatus)) {
            dayData[mappedStatus] =
              (dayData[mappedStatus] as number) + storyPoints;
          }
        }
      }
    }

    cfdDays.push(dayData);
  }

  return {
    buckets,
    days: cfdDays,
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

async function getIssueStatusAtDate(
  issue: IssueDocument,
  date: Date
): Promise<string> {
  // Get all status changes up to this date
  const statusChanges =
    issue.changelog
      ?.filter(
        (change: ChangelogEntry) =>
          change.field === "status" && new Date(change.at) <= date
      )
      .sort(
        (a: ChangelogEntry, b: ChangelogEntry) =>
          new Date(a.at).getTime() - new Date(b.at).getTime()
      ) || [];

  // If no status changes, return current status
  if (statusChanges.length === 0) {
    return issue.status;
  }

  // Return the last status change before this date
  const lastChange = statusChanges[statusChanges.length - 1];
  return lastChange.newValue || issue.status;
}

function mapStatusToBucket(status: string): string {
  const statusMap: Record<string, string> = {
    backlog: "todo",
    selected: "todo",
    "to-do": "todo",
    "in-progress": "in-progress",
    "in-review": "review",
    testing: "review",
    completed: "done",
    closed: "done",
  };

  return statusMap[status] || "todo";
}
