import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/users/team - Get team members for assignee selection
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await connectDB();

    let query: Record<string, unknown> = {};

    if (currentUser.role === "admin") {
      // Admin can see all users
      query = {};
    } else if (currentUser.team) {
      // Regular users can only see their team members
      query = { team: currentUser.team };
    } else {
      // Users without team can only see themselves
      query = { _id: currentUser._id };
    }

    const users = await User.find(query)
      .select("_id name email")
      .sort({ name: 1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
