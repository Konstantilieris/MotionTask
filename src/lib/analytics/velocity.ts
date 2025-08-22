import { Db, ObjectId } from "mongodb";

export interface VelocityPoint {
  sprint: string;
  sprintName: string;
  points: number;
  startDate: Date;
  endDate: Date;
}

export interface VelocitySeries {
  series: VelocityPoint[];
}

export async function velocitySeries(
  db: Db,
  projectKey: string
): Promise<VelocitySeries> {
  // Get project
  const project = await db.collection("projects").findOne({ key: projectKey });
  if (!project) {
    throw new Error("Project not found");
  }

  // Get completed sprints ordered by start date
  const sprints = await db
    .collection("sprints")
    .find({
      project: project._id,
      status: "completed",
      deletedAt: { $exists: false },
    })
    .sort({ startDate: 1 })
    .toArray();

  const series: VelocityPoint[] = [];

  for (const sprint of sprints) {
    // Get completed story points for this sprint
    const completedIssues = await db
      .collection("issues")
      .find({
        project: project._id,
        sprint: sprint._id,
        status: "done",
        deletedAt: { $exists: false },
      })
      .toArray();

    const points = completedIssues.reduce((total, issue) => {
      return total + (issue.storyPoints || 0);
    }, 0);

    series.push({
      sprint:
        sprint.key ||
        `SPRINT-${sprint.number || sprint._id.toString().slice(-6)}`,
      sprintName: sprint.name,
      points,
      startDate: new Date(sprint.startDate),
      endDate: new Date(sprint.endDate),
    });
  }

  return { series };
}
