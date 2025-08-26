import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { ROLE } from "@/types/roles";

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

// GET /api/teams?query=&page=&limit=&deleted= → list + pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin users can access teams management
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const deleted = searchParams.get("deleted") || "false";

    await connectDB();

    // Build filter
    const filter: Record<string, unknown> = {};

    // Handle deleted filter
    if (deleted === "true") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "false") {
      filter.deletedAt = null;
    }
    // If deleted === "all", don't add deletedAt filter

    // Handle search query
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { slug: { $regex: query, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // For deleted filter, we need to skip the middleware
    let teamsQuery;
    if (deleted === "true" || deleted === "all") {
      teamsQuery = Team.find(filter, null, { skipMiddleware: true });
    } else {
      teamsQuery = Team.find(filter);
    }

    const [teams, totalCount] = await Promise.all([
      teamsQuery
        .populate("members", "name email role")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      deleted === "true" || deleted === "all"
        ? Team.countDocuments(filter)
        : Team.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      teams,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/teams → create
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await AuthUtils.getUserById(session.user.id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, avatar, defaultRole, members } = body;

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json(
        { error: "Name must be between 2 and 60 characters" },
        { status: 400 }
      );
    }

    // Generate or validate slug
    const finalSlug = slug || generateSlug(name.trim());
    if (!isValidSlug(finalSlug)) {
      return NextResponse.json(
        {
          error:
            "Slug must be 2-64 characters with only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Validate default role
    if (defaultRole && !Object.values(ROLE).includes(defaultRole)) {
      return NextResponse.json(
        { error: "Invalid default role" },
        { status: 400 }
      );
    }

    // Validate avatar URL
    if (avatar && !isValidUrl(avatar)) {
      return NextResponse.json(
        { error: "Avatar must be a valid HTTPS URL" },
        { status: 400 }
      );
    }

    // Validate members array
    let validMembers: string[] = [];
    if (members && Array.isArray(members)) {
      // Dedupe and validate
      const uniqueMembers = [...new Set(members)];
      const users = await User.find({ _id: { $in: uniqueMembers } });
      if (users.length !== uniqueMembers.length) {
        return NextResponse.json(
          { error: "Some member IDs are invalid" },
          { status: 400 }
        );
      }
      validMembers = uniqueMembers;
    }

    await connectDB();

    try {
      const team = new Team({
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || undefined,
        avatar: avatar || undefined,
        defaultRole: defaultRole || ROLE.MEMBER,
        members: validMembers,
      });

      await team.save();

      // Populate the team for response
      await team.populate("members", "name email role");

      return NextResponse.json(
        {
          message: "Team created successfully",
          team,
        },
        { status: 201 }
      );
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
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
