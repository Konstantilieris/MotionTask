import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";
import { ROLE } from "@/types/roles";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to validate slug format
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{2,64}$/.test(slug);
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/teams/:id → details (include members)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin users can access teams management
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Find team including deleted ones for admin
    const team = await Team.findById(id, null, {
      skipMiddleware: true,
    }).populate("members", "name email role");

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/:id → update fields (name, slug, description, avatar, defaultRole)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, slug, description, avatar, defaultRole } = body;

    await connectDB();

    // Find the team (including deleted ones for admin)
    const team = await Team.findById(id, null, { skipMiddleware: true });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Validate and update name
    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 60) {
        return NextResponse.json(
          { error: "Name must be between 2 and 60 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    // Validate and update slug
    if (slug !== undefined) {
      if (!isValidSlug(slug)) {
        return NextResponse.json(
          {
            error:
              "Slug must be 2-64 characters with only lowercase letters, numbers, and hyphens",
          },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }

    // Update description
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    // Validate and update avatar
    if (avatar !== undefined) {
      if (avatar && !isValidUrl(avatar)) {
        return NextResponse.json(
          { error: "Avatar must be a valid HTTPS URL" },
          { status: 400 }
        );
      }
      updateData.avatar = avatar || null;
    }

    // Validate and update default role
    if (defaultRole !== undefined) {
      if (!Object.values(ROLE).includes(defaultRole)) {
        return NextResponse.json(
          { error: "Invalid default role" },
          { status: 400 }
        );
      }
      updateData.defaultRole = defaultRole;
    }

    try {
      const updatedTeam = await Team.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        context: "query",
      }).populate("members", "name email role");

      return NextResponse.json({
        message: "Team updated successfully",
        team: updatedTeam,
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        const mongoError = error as { keyPattern?: Record<string, unknown> };
        const field = mongoError.keyPattern?.name ? "name" : "slug";
        return NextResponse.json(
          { error: `A team with this ${field} already exists` },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/:id → soft delete (sets deletedAt)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();

    // Find team (including deleted ones)
    const team = await Team.findById(id, null, { skipMiddleware: true });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if already deleted
    if (team.deletedAt) {
      return NextResponse.json(
        { error: "Team is already deleted" },
        { status: 400 }
      );
    }

    // Prevent deletion of default team
    if (team.slug === "default") {
      return NextResponse.json(
        { error: "Cannot delete default team" },
        { status: 400 }
      );
    }

    // Soft delete
    team.deletedAt = new Date();
    await team.save();

    return NextResponse.json({
      message: "Team deleted successfully",
      team,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
