/**
 * LexoRank-style string ranking utilities
 * Allows efficient reordering without full database reindex
 */

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = ALPHABET.length;
const MIN_CHAR = ALPHABET[0];
const MAX_CHAR = ALPHABET[BASE - 1];

/**
 * Generate a rank between two existing ranks
 * @param before The rank that should come before the new rank (null for beginning)
 * @param after The rank that should come after the new rank (null for end)
 * @returns A new rank string that sorts between before and after
 */
export function rankBetween(
  before: string | null,
  after: string | null
): string {
  // If both null, return middle rank
  if (!before && !after) {
    return "M";
  }

  // If no before rank, create one that comes before after
  if (!before) {
    return beforeRank(after!);
  }

  // If no after rank, create one that comes after before
  if (!after) {
    return afterRank(before);
  }

  // Generate rank between two existing ranks
  return betweenRanks(before, after);
}

/**
 * Generate a rank that comes before the given rank
 */
function beforeRank(rank: string): string {
  if (rank.length === 0) {
    return MIN_CHAR;
  }

  const firstChar = rank[0];
  const firstCharIndex = ALPHABET.indexOf(firstChar);

  if (firstCharIndex > 0) {
    return ALPHABET[firstCharIndex - 1] + MAX_CHAR.repeat(rank.length - 1);
  }

  // If first character is already minimum, prepend a character
  return MIN_CHAR + beforeRank(rank);
}

/**
 * Generate a rank that comes after the given rank
 */
function afterRank(rank: string): string {
  if (rank.length === 0) {
    return MAX_CHAR;
  }

  const lastChar = rank[rank.length - 1];
  const lastCharIndex = ALPHABET.indexOf(lastChar);

  if (lastCharIndex < BASE - 1) {
    return rank.slice(0, -1) + ALPHABET[lastCharIndex + 1];
  }

  // If last character is already maximum, append a character
  return rank + MIN_CHAR;
}

/**
 * Generate a rank between two existing ranks
 */
function betweenRanks(before: string, after: string): string {
  if (before >= after) {
    throw new Error("Before rank must be less than after rank");
  }

  let result = "";
  let i = 0;

  while (i < Math.max(before.length, after.length)) {
    const beforeChar = i < before.length ? before[i] : MIN_CHAR;
    const afterChar = i < after.length ? after[i] : MAX_CHAR;

    const beforeIndex = ALPHABET.indexOf(beforeChar);
    const afterIndex = ALPHABET.indexOf(afterChar);

    if (afterIndex - beforeIndex > 1) {
      // We can fit a character between them
      const midIndex = Math.floor((beforeIndex + afterIndex) / 2);
      return result + ALPHABET[midIndex];
    }

    if (beforeIndex === afterIndex) {
      // Characters are the same, continue to next position
      result += beforeChar;
      i++;
      continue;
    }

    // afterIndex - beforeIndex === 1, we need to go deeper
    result += beforeChar;

    // If we're at the end of the before string, we can append
    if (i + 1 >= before.length) {
      return result + ALPHABET[beforeIndex + 1];
    }

    i++;
  }

  // If we get here, the strings are too similar, append a character
  return result + ALPHABET[1];
}

/**
 * Generate an initial rank for the first item in a list
 */
export function initialRank(): string {
  return "M";
}

/**
 * Generate a rank for appending to the end of a list
 */
export function appendRank(lastRank: string): string {
  return afterRank(lastRank);
}

/**
 * Generate a rank for prepending to the beginning of a list
 */
export function prependRank(firstRank: string): string {
  return beforeRank(firstRank);
}

/**
 * Validate that a rank string is valid
 */
export function isValidRank(rank: string): boolean {
  if (!rank || rank.length === 0) {
    return false;
  }

  return rank.split("").every((char) => ALPHABET.includes(char));
}

/**
 * Sort an array of objects by their rank property
 */
export function sortByRank<T extends { rank: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.rank.localeCompare(b.rank));
}

/**
 * Normalize ranks when they become too long
 * This should be called periodically to keep ranks short
 */
export function normalizeRanks<
  T extends { rank: string; id?: string; _id?: string }
>(items: T[]): { [id: string]: string } {
  const sorted = sortByRank(items);
  const updates: { [id: string]: string } = {};

  sorted.forEach((item, index) => {
    const newRank = (index + 1).toString(BASE).toUpperCase();
    const itemId = item.id || item._id;
    if (newRank !== item.rank && itemId) {
      updates[itemId] = newRank;
    }
  });

  return updates;
}
