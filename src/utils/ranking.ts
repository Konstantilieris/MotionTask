/**
 * Fractional ranking system for drag-and-drop ordering
 * Based on Jira's ranking algorithm
 */

const MIN_RANK = 1;
const MAX_RANK = Number.MAX_SAFE_INTEGER;
const REBALANCE_THRESHOLD = 8; // When differences become too small

/**
 * Generate initial rank (middle of range)
 */
export function rankInitial(): number {
  return Math.floor((MIN_RANK + MAX_RANK) / 2);
}

/**
 * Generate rank between two positions
 */
export function rankBetween(prevRank?: number, nextRank?: number): number {
  // If no previous rank, place before next
  if (prevRank === undefined) {
    const next = nextRank || MAX_RANK;
    return Math.max(MIN_RANK, Math.floor(next / 2));
  }

  // If no next rank, place after previous
  if (nextRank === undefined) {
    const prev = prevRank || MIN_RANK;
    return Math.min(MAX_RANK, Math.floor((prev + MAX_RANK) / 2));
  }

  // Place between the two ranks
  const diff = nextRank - prevRank;
  if (diff <= 1) {
    // Need to rebalance - return a temporary rank
    return prevRank + 0.5;
  }

  return Math.floor((prevRank + nextRank) / 2);
}

/**
 * Check if ranks need renormalization
 */
export function needsRenormalization(ranks: number[]): boolean {
  if (ranks.length < 2) return false;

  for (let i = 1; i < ranks.length; i++) {
    const diff = ranks[i] - ranks[i - 1];
    if (diff < REBALANCE_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Renormalize ranks for a status column
 */
export async function renormalize(
  projectId: string,
  status: string
): Promise<void> {
  try {
    const Issue = (await import("@/models/Issue")).default;

    // Get all issues in this status, sorted by current position
    const issues = await Issue.find({
      project: projectId,
      status,
      deletedAt: null,
    }).sort({ position: 1 });

    if (issues.length === 0) return;

    // Calculate new evenly distributed ranks
    const step = Math.floor((MAX_RANK - MIN_RANK) / (issues.length + 1));

    // Update positions in batches
    const updates = issues.map((issue, index) => ({
      updateOne: {
        filter: { _id: issue._id },
        update: { position: MIN_RANK + step * (index + 1) },
      },
    }));

    await Issue.bulkWrite(updates);

    console.log(`Renormalized ${issues.length} issues in status ${status}`);
  } catch (error) {
    console.error("Failed to renormalize ranks:", error);
  }
}

/**
 * Get rank for moving to top of list
 */
export function rankFirst(firstRank?: number): number {
  const first = firstRank || MAX_RANK;
  return Math.max(MIN_RANK, Math.floor(first / 2));
}

/**
 * Get rank for moving to bottom of list
 */
export function rankLast(lastRank?: number): number {
  const last = lastRank || MIN_RANK;
  return Math.min(MAX_RANK, Math.floor((last + MAX_RANK) / 2));
}

/**
 * Reorder multiple items efficiently
 */
export function reorderItems<T extends { position: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);

  // Recalculate positions
  const step = Math.floor((MAX_RANK - MIN_RANK) / (result.length + 1));
  result.forEach((item, index) => {
    item.position = MIN_RANK + step * (index + 1);
  });

  return result;
}

/**
 * Generate safe rank avoiding conflicts
 */
export function generateSafeRank(existingRanks: number[]): number {
  const sorted = existingRanks.sort((a, b) => a - b);

  // Find a gap in the sequence
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > REBALANCE_THRESHOLD) {
      return Math.floor((sorted[i - 1] + sorted[i]) / 2);
    }
  }

  // No gap found, place at the end
  const lastRank = sorted[sorted.length - 1] || MIN_RANK;
  return Math.min(MAX_RANK, lastRank + 1000);
}
