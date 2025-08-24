import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsService } from "@/services/reviews.service";
import { ToggleChecklistDto } from "@/lib/validation/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/reviews/[reviewId]/checklist - Toggle checklist item
export async function PATCH(
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
    const validatedData = ToggleChecklistDto.parse(body);

    const review = await ReviewsService.toggleChecklistItem(
      reviewId,
      validatedData.itemIndex,
      validatedData.done,
      session.user.id
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error toggling checklist item:", error);

    if (error instanceof Error) {
      if (error.message.includes("Review not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Invalid checklist item")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}
