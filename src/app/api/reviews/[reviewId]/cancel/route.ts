import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/[reviewId]/cancel - Cancel a review
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

    const review = await ReviewsService.cancel({
      reviewId,
      actorId: session.user.id,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error cancelling review:", error);

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes("Only the review requester")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("Review not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to cancel review" },
      { status: 500 }
    );
  }
}
