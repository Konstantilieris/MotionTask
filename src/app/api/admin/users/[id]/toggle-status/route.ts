import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  accessToken?: string;
  error?: string;
}

// PUT /api/admin/users/[id]/toggle-status - Toggle user active status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(
      authOptions
    )) as ExtendedSession | null;

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent toggling self
    if (user.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot toggle your own account status" },
        { status: 400 }
      );
    }

    // Toggle active status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { active: !user.active },
      { new: true }
    )
      .populate("team", "name")
      .select("-passwordHash")
      .lean();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
