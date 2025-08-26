import connectDB from "@/lib/mongodb";
import Team, { ITeam } from "@/models/Team";
import { ROLE } from "@/types/roles";

export class TeamUtils {
  static async createTeam(teamData: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<typeof Team.prototype> {
    await connectDB();

    // Check if team already exists
    const existingTeam = await Team.findOne({
      $or: [{ name: teamData.name }, { slug: teamData.slug }],
    });

    if (existingTeam) {
      throw new Error("Team with this name or slug already exists");
    }

    const team = new Team({
      name: teamData.name,
      slug: teamData.slug.toLowerCase(),
      description: teamData.description,
      defaultRole: ROLE.MEMBER,
      members: [],
    });

    await team.save();
    return team;
  }

  static async getDefaultTeam(): Promise<ITeam> {
    await connectDB();

    let defaultTeam = await Team.findOne({ slug: "default" });

    if (!defaultTeam) {
      defaultTeam = await this.createTeam({
        name: "Default Team",
        slug: "default",
        description: "Default team for new users",
      });
    }

    return defaultTeam as ITeam;
  }

  static async addMemberToTeam(
    teamId: string,
    userId: string
  ): Promise<ITeam | null> {
    await connectDB();

    return await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { members: userId } },
      { new: true }
    );
  }

  static async removeMemberFromTeam(
    teamId: string,
    userId: string
  ): Promise<ITeam | null> {
    await connectDB();

    return await Team.findByIdAndUpdate(
      teamId,
      { $pull: { members: userId } },
      { new: true }
    );
  }

  static async getTeamById(id: string): Promise<ITeam | null> {
    await connectDB();
    return await Team.findById(id).populate("members", "name email role");
  }

  static async getTeamBySlug(slug: string): Promise<ITeam | null> {
    await connectDB();
    return await Team.findOne({ slug }).populate("members", "name email role");
  }
}
