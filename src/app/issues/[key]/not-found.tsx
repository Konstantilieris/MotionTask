"use client";

import { Search, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Issue Not Found
          </h1>
          <p className="text-gray-600">
            The issue you&apos;re looking for doesn&apos;t exist or may have
            been deleted.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            What you can do:
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• Check if the issue key is correct</li>
            <li>• Verify you have permission to view this issue</li>
            <li>• Search for the issue in the project board</li>
            <li>• Contact your project administrator</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/issues"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Browse all issues →
          </Link>
        </div>
      </div>
    </div>
  );
}
