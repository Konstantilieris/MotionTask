import { z } from "zod";

export const IssueFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),
  description: z.string().optional(),
  type: z.enum(["task", "bug", "story", "epic", "subtask"]).default("task"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["backlog", "todo", "in-progress", "done"]).default("todo"),
  assignee: z.string().optional(),
  storyPoints: z
    .number()
    .int()
    .min(1, "Story points must be at least 1")
    .max(1000, "Story points must be less than 1000")
    .nullable()
    .optional(),
  dueDate: z.string().optional(),
  sprint: z.string().optional(),
  epic: z.string().optional(),
  parent: z.string().optional(),
  labels: z.array(z.string()).default([]),

  // Time tracking
  timeTracking: z
    .object({
      originalEstimate: z
        .number()
        .int()
        .min(0, "Original estimate must be non-negative")
        .nullable()
        .optional(),
      remainingEstimate: z
        .number()
        .int()
        .min(0, "Remaining estimate must be non-negative")
        .nullable()
        .optional(),
      timeSpent: z
        .number()
        .int()
        .min(0, "Time spent must be non-negative")
        .nullable()
        .optional(),
    })
    .optional(),

  // Attachments (handled separately in form)
  attachments: z.array(z.any()).default([]),
});

export type IssueFormData = z.infer<typeof IssueFormSchema>;

export const defaultIssueFormValues: IssueFormData = {
  title: "",
  description: "",
  type: "task",
  priority: "medium",
  status: "todo",
  assignee: "",
  storyPoints: null,
  dueDate: "",
  sprint: "",
  epic: "",
  parent: "",
  labels: [],
  timeTracking: {
    originalEstimate: null,
    remainingEstimate: null,
    timeSpent: null,
  },
  attachments: [],
};
