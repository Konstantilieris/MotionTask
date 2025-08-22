"use client";

import { Chip, Button } from "@heroui/react";
import { X, Filter } from "lucide-react";
import { useFilterStore } from "@/lib/stores/filter-store";

export default function FilterSummary() {
  const { filters, clearFilter, clearFilters, removeFilterValue } =
    useFilterStore();

  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string }> =
      [];

    if (filters.searchQuery) {
      activeFilters.push({
        key: "searchQuery",
        label: "Search",
        value: filters.searchQuery,
      });
    }

    filters.assignee.forEach((assignee) => {
      activeFilters.push({
        key: "assignee",
        label: "Assignee",
        value: assignee === "unassigned" ? "Unassigned" : assignee,
      });
    });

    filters.type.forEach((type) => {
      activeFilters.push({
        key: "type",
        label: "Type",
        value: type.charAt(0).toUpperCase() + type.slice(1),
      });
    });

    filters.priority.forEach((priority) => {
      activeFilters.push({
        key: "priority",
        label: "Priority",
        value: priority.charAt(0).toUpperCase() + priority.slice(1),
      });
    });

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Filter className="h-4 w-4" />
            <span>Active filters:</span>
          </div>
          {activeFilters.map((filter, index) => (
            <Chip
              key={`${filter.key}-${index}`}
              size="sm"
              variant="flat"
              color="primary"
              endContent={
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="h-4 w-4 min-w-4 p-0"
                  onPress={() => {
                    if (filter.key === "searchQuery") {
                      clearFilter("searchQuery");
                    } else {
                      // For array filters, remove the specific value
                      const valueToRemove =
                        filter.key === "assignee" &&
                        filter.value === "Unassigned"
                          ? "unassigned"
                          : filter.value.toLowerCase();
                      removeFilterValue(
                        filter.key as keyof typeof filters,
                        valueToRemove
                      );
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              }
              className="text-xs"
            >
              {filter.label}: {filter.value}
            </Chip>
          ))}
        </div>
        <Button
          size="sm"
          variant="light"
          onPress={clearFilters}
          className="text-gray-400 hover:text-white"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}
