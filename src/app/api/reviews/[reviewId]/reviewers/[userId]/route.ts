import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/reviews/[reviewId]/reviewers/[userId] - Remove a reviewer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { reviewId, userId } = resolvedParams;

    const review = await ReviewsService.removeReviewer(
      reviewId,
      userId,
      session.user.id
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error removing reviewer:", error);

    if (error instanceof Error) {
      if (error.message.includes("Review not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("not a reviewer")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to remove reviewer" },
      { status: 500 }
    );
  }
}
