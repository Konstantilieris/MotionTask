import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";
import { ReviewerActionDto } from "@/lib/validation/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/[reviewId]/request-changes - Request changes on a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const reviewId = resolvedParams.reviewId;
    const body = await request.json();

    // Validate request body
    const validatedData = ReviewerActionDto.parse(body);

    // For requesting changes, comment should be provided (business rule)
    if (!validatedData.comment || validatedData.comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment is required when requesting changes" },
        { status: 400 }
      );
    }

    const review = await ReviewsService.requestChanges({
      reviewId,
      actorId: session.user.id,
      comment: validatedData.comment,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error requesting changes:", error);

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes("Only assigned reviewers")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("Review not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message.includes("cancelled") ||
        error.message.includes("expired")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to request changes" },
      { status: 500 }
    );
  }
}
