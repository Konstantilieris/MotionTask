"use client";

import { CheckCircle, XCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastState {
  type: "success" | "error";
  message: string;
  isVisible: boolean;
}

// Global toast state
let toastListener: ((toast: ToastState | null) => void) | null = null;

export function showToast(type: "success" | "error", message: string) {
  if (toastListener) {
    toastListener({ type, message, isVisible: true });
  }
}

export function showSuccess(message: string) {
  showToast("success", message);
}

export function showError(message: string) {
  showToast("error", message);
}

export default function ToastContainer() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    toastListener = setToast;
    return () => {
      toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (toast?.isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setToast(null), 300); // Wait for exit animation
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toast?.isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setToast(null), 300);
  };

  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out ${
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm
        ${
          toast.type === "success"
            ? "bg-green-900/90 border-green-700 text-green-100"
            : "bg-red-900/90 border-red-700 text-red-100"
        }
      `}
      >
        {toast.type === "success" ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-400" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={handleClose}
          className="ml-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
