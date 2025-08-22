import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";
import { ReviewerActionDto } from "@/lib/validation/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/[reviewId]/approve - Approve a review
export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = params.reviewId;
    const body = await request.json();

    // Validate request body
    const validatedData = ReviewerActionDto.parse(body);

    const review = await ReviewsService.approve({
      reviewId,
      actorId: session.user.id,
      comment: validatedData.comment,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error approving review:", error);

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
      { error: "Failed to approve review" },
      { status: 500 }
    );
  }
}
