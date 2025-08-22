"use client";

import { Edit2, Save, X } from "lucide-react";
import { useState } from "react";

interface DescriptionProps {
  issue: {
    _id: string;
    description?: string;
  };
}

export default function Description({ issue }: DescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(issue.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: API call to update description
      console.log("Saving description:", description);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDescription(issue.description || "");
    setIsEditing(false);
  };

  const formatDescription = (text: string) => {
    // Simple formatting - convert line breaks to paragraphs
    return text.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {paragraph || <br />}
      </p>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Description</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700/50"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-64 p-3 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-400"
            placeholder="Add a description..."
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="prose max-w-none">
          {issue.description ? (
            <div className="text-gray-200 leading-relaxed text-base">
              {formatDescription(issue.description)}
            </div>
          ) : (
            <div className="text-gray-500 italic py-8 text-center border-2 border-dashed border-gray-700 rounded-lg">
              No description provided. Click Edit to add one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
