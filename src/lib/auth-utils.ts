import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import { TeamUtils } from "@/lib/team-utils";

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async createUser(userData: {
    name: string;
    email: string;
    password: string;
    teamId?: string;
  }): Promise<IUser> {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: userData.email.toLowerCase(),
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Get default team if no team provided
    let teamId = userData.teamId;
    if (!teamId) {
      const defaultTeam = await TeamUtils.getDefaultTeam();
      teamId = (defaultTeam._id as string).toString();
    }

    // Create user
    const user = new User({
      name: userData.name,
      email: userData.email.toLowerCase(),
      passwordHash: hashedPassword,
      team: teamId,
    });

    await user.save();

    // Add user to team members
    await TeamUtils.addMemberToTeam(teamId!, (user._id as string).toString());

    return user;
  }

  static async validateUser(
    email: string,
    password: string
  ): Promise<IUser | null> {
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return null;
    }

    // Validate password
    const isValidPassword = await this.comparePassword(
      password,
      user.passwordHash
    );
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  static async getUserById(id: string): Promise<IUser | null> {
    await connectDB();
    return await User.findById(id).select("-passwordHash");
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    await connectDB();
    return await User.findOne({ email: email.toLowerCase() }).select(
      "-passwordHash"
    );
  }

  static async updateUser(
    id: string,
    updates: Partial<{ name: string; email: string }>
  ): Promise<IUser | null> {
    await connectDB();
    return await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");
  }

  static async deleteUser(id: string): Promise<boolean> {
    await connectDB();
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}
