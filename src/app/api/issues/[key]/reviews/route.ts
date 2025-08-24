import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";
import { CreateReviewDto } from "@/lib/validation/reviews";
import Issue from "@/models/Issue";
import connectDB from "@/lib/mongodb";
import { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper function to check if a string is a valid ObjectId
function isObjectId(str: string): boolean {
  return (
    Types.ObjectId.isValid(str) && new Types.ObjectId(str).toString() === str
  );
}

// POST /api/issues/[key]/reviews - Create review for an issue
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;
    const body = await request.json();

    // Validate request body
    const validatedData = CreateReviewDto.parse(body);

    // Find issue by key or ObjectId
    await connectDB();
    let issue;
    if (isObjectId(key)) {
      issue = await Issue.findById(key);
    } else {
      issue = await Issue.findOne({ key: key, deletedAt: null });
    }

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // TODO: Add proper authorization check for project access

    // Convert dueDate string to Date if provided
    const dueDate = validatedData.dueDate
      ? new Date(validatedData.dueDate)
      : undefined;

    const review = await ReviewsService.createReview({
      issueId: (issue._id as Types.ObjectId).toString(),
      requestedBy: session.user.id,
      reviewers: validatedData.reviewers,
      requiredApprovals: validatedData.requiredApprovals,
      dueDate,
      checklist: validatedData.checklist,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.message },
        { status: 400 }
      );
    }

    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/issues/[key]/reviews - List reviews for an issue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { key } = resolvedParams;

    // Find issue by key or ObjectId
    await connectDB();
    let issue;
    if (isObjectId(key)) {
      issue = await Issue.findById(key);
    } else {
      issue = await Issue.findOne({ key: key, deletedAt: null });
    }

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // TODO: Add proper authorization check for project access

    const reviews = await ReviewsService.listForIssue(
      (issue._id as Types.ObjectId).toString()
    );
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
