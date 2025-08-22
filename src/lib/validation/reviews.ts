import { z } from "zod";

export const CreateReviewDto = z.object({
  reviewers: z.array(z.string()).min(1, "At least one reviewer is required"),
  requiredApprovals: z.number().int().min(1).optional().default(1),
  dueDate: z.string().datetime().optional(),
  checklist: z
    .array(
      z.object({
        label: z.string().min(1, "Checklist item label is required"),
      })
    )
    .optional(),
});

export const ReviewerActionDto = z.object({
  comment: z
    .string()
    .max(2000, "Comment must be less than 2000 characters")
    .optional(),
});

export const AddReviewerDto = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const ToggleChecklistDto = z.object({
  itemIndex: z.number().int().min(0),
  done: z.boolean(),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewDto>;
export type ReviewerActionRequest = z.infer<typeof ReviewerActionDto>;
export type AddReviewerRequest = z.infer<typeof AddReviewerDto>;
export type ToggleChecklistRequest = z.infer<typeof ToggleChecklistDto>;
