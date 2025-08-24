import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";
import { AddReviewerDto } from "@/lib/validation/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/reviews/[reviewId]/reviewers - Add a reviewer
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
    const validatedData = AddReviewerDto.parse(body);

    const review = await ReviewsService.addReviewer(
      reviewId,
      validatedData.userId,
      session.user.id
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error adding reviewer:", error);

    if (error instanceof Error) {
      if (error.message.includes("Review not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already a reviewer")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to add reviewer" },
      { status: 500 }
    );
  }
}
