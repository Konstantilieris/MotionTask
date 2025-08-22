import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import { AuthUtils } from "@/lib/auth-utils";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await AuthUtils.getUserById(session.user.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Find and remove duplicate soft-deleted issues with same key
    const duplicateKeys = await Issue.aggregate([
      {
        $group: {
          _id: "$key",
          count: { $sum: 1 },
          docs: { $push: { id: "$_id", deletedAt: "$deletedAt" } },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    let cleanedCount = 0;

    for (const duplicate of duplicateKeys) {
      const { _id, docs } = duplicate;

      // Keep only the non-deleted one, or the most recent if all are deleted
      const nonDeleted = docs.filter(
        (doc: { deletedAt?: Date }) => !doc.deletedAt
      );
      const toDelete =
        nonDeleted.length > 0
          ? docs.filter((doc: { deletedAt?: Date }) => doc.deletedAt)
          : docs.slice(1); // Keep the first one

      // Permanently delete the duplicates
      for (const doc of toDelete) {
        await Issue.findByIdAndDelete((doc as { id: string }).id);
        cleanedCount++;
      }
    }

    return NextResponse.json({
      message: `Cleaned up ${cleanedCount} duplicate issues`,
      duplicateKeys: duplicateKeys.map((d) => d._id),
    });
  } catch (error) {
    console.error("Error cleaning up duplicate keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
