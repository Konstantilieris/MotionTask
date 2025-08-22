import { IReview } from "@/models/Review";

export async function listReviews(issueId: string): Promise<IReview[]> {
  const response = await fetch(`/api/issues/${issueId}/reviews`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  return response.json();
}

export async function createReview(
  issueId: string,
  payload: {
    reviewers: string[];
    requiredApprovals?: number;
    dueDate?: string;
    checklist?: { label: string }[];
  }
): Promise<IReview> {
  const response = await fetch(`/api/issues/${issueId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create review: ${response.statusText}`);
  }

  return response.json();
}

export async function approveReview(
  reviewId: string,
  comment?: string
): Promise<IReview> {
  const response = await fetch(`/api/reviews/${reviewId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    throw new Error(`Failed to approve review: ${response.statusText}`);
  }

  return response.json();
}

export async function requestChanges(
  reviewId: string,
  comment: string
): Promise<IReview> {
  const response = await fetch(`/api/reviews/${reviewId}/request-changes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    throw new Error(`Failed to request changes: ${response.statusText}`);
  }

  return response.json();
}

export async function cancelReview(reviewId: string): Promise<IReview> {
  const response = await fetch(`/api/reviews/${reviewId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel review: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleChecklist(
  reviewId: string,
  index: number,
  done: boolean
): Promise<IReview> {
  const response = await fetch(`/api/reviews/${reviewId}/checklist`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ index, done }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle checklist: ${response.statusText}`);
  }

  return response.json();
}
