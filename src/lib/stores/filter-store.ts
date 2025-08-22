import { create } from "zustand";

export interface FilterState {
  assignee: string[];
  type: string[];
  priority: string[];
  searchQuery: string;
}

interface FilterStore {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string[] | string) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof FilterState) => void;
  removeFilterValue: (key: keyof FilterState, value: string) => void;
}

const initialFilters: FilterState = {
  assignee: [],
  type: [],
  priority: [],
  searchQuery: "",
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: initialFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  clearFilters: () =>
    set(() => ({
      filters: initialFilters,
    })),
  clearFilter: (key) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: Array.isArray(state.filters[key]) ? [] : "",
      },
    })),
  removeFilterValue: (key, value) =>
    set((state) => {
      const currentValue = state.filters[key];
      if (Array.isArray(currentValue)) {
        return {
          filters: {
            ...state.filters,
            [key]: currentValue.filter((v) => v !== value),
          },
        };
      }
      return state;
    }),
}));
