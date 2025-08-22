import type { FilterState } from "@/lib/stores/filter-store";

interface Issue {
  _id: string;
  title: string;
  key: string;
  description?: string;
  status: string;
  type: string;
  priority: string;
  position: number;
  storyPoints?: number;
  assignee?: {
    name: string;
    email: string;
    _id?: string;
  };
  reporter: {
    name: string;
    email: string;
  };
}

export function filterIssues(issues: Issue[], filters: FilterState): Issue[] {
  return issues.filter((issue) => {
    // Search query filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const matchesSearch =
        issue.title.toLowerCase().includes(searchLower) ||
        issue.key.toLowerCase().includes(searchLower) ||
        (issue.description &&
          issue.description.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Assignee filter
    if (filters.assignee.length > 0) {
      const isUnassigned = !issue.assignee;
      const hasUnassignedFilter = filters.assignee.includes("unassigned");
      const hasAssigneeFilter =
        issue.assignee &&
        filters.assignee.some(
          (assigneeId) =>
            issue.assignee?._id === assigneeId ||
            issue.assignee?.email === assigneeId
        );

      if (!((isUnassigned && hasUnassignedFilter) || hasAssigneeFilter)) {
        return false;
      }
    }

    // Type filter
    if (filters.type.length > 0 && !filters.type.includes(issue.type)) {
      return false;
    }

    // Priority filter
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(issue.priority)
    ) {
      return false;
    }

    return true;
  });
}
