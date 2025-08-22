"use client";

import { Plus } from "lucide-react";
import { useModalStore } from "@/lib/stores/modal-store";

export default function NewProjectButton() {
  const { openModal } = useModalStore();

  return (
    <button
      onClick={() => openModal("project-create")}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      <Plus className="h-4 w-4 mr-2" />
      New Project
    </button>
  );
}
