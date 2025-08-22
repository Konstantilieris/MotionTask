import { create } from "zustand";

interface ModalData {
  [key: string]: unknown;
}

interface ModalState {
  modals: Record<string, boolean>;
  data: ModalData;
  openModal: (id: string, data?: unknown) => void;
  closeModal: (id: string) => void;
  isOpen: (id: string) => boolean;
  getData: (id: string) => unknown;
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: {},
  data: {},

  openModal: (id: string, data?: unknown) => {
    set((state: ModalState) => ({
      modals: { ...state.modals, [id]: true },
      data: data ? { ...state.data, [id]: data } : state.data,
    }));
  },

  closeModal: (id: string) => {
    set((state: ModalState) => ({
      modals: { ...state.modals, [id]: false },
      data: { ...state.data, [id]: undefined },
    }));
  },

  isOpen: (id: string) => {
    return get().modals[id] || false;
  },

  getData: (id: string) => {
    return get().data[id];
  },
}));
