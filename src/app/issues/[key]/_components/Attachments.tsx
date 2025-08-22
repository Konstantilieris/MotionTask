"use client";

import {
  Paperclip,
  Download,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Attachment {
  _id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: {
    name: string;
    avatar?: string;
  };
  uploadedAt: string;
}

interface AttachmentsProps {
  issueId: string;
}

export default function Attachments({ issueId }: AttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/issues/${issueId}/attachments`);
        if (response.ok) {
          const data = await response.json();
          setAttachments(data.attachments || []);
        } else {
          setAttachments([]);
        }
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
        setAttachments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttachments();
  }, [issueId]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log("Uploading file:", file.name);
        // TODO: API call to upload file
      }
      // Refresh attachments
      // fetchAttachments();
    } catch (error) {
      console.error("Failed to upload files:", error);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      // TODO: API call to delete attachment
      console.log("Deleting attachment:", attachmentId);
      // Refresh attachments
      // fetchAttachments();
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <ImageIcon className="h-4 w-4 text-emerald-400" />;
    if (type.startsWith("video/"))
      return <Video className="h-4 w-4 text-purple-400" />;
    if (type === "application/pdf" || type.startsWith("text/"))
      return <FileText className="h-4 w-4 text-blue-400" />;
    return <File className="h-4 w-4 text-gray-400" />;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - uploadDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return uploadDate.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-100">
          Attachments ({attachments.length})
        </h3>

        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            aria-label="Upload files"
          />
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment._id}
            className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="w-8 h-8 bg-gray-800/50 rounded-lg flex items-center justify-center">
              {getFileIcon(attachment.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-200 truncate">
                  {attachment.name}
                </h4>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatFileSize(attachment.size)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Uploaded by {attachment.uploadedBy.name}</span>
                <span>•</span>
                <span>{formatTimeAgo(attachment.uploadedAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={attachment.url}
                download={attachment.name}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-500/20 text-blue-400 rounded transition-all"
                aria-label="Download attachment"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => handleDeleteAttachment(attachment._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
                aria-label="Delete attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {attachments.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No attachments yet</p>
            <p className="text-xs mt-1 opacity-75">
              Upload files to share with your team
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress/Info */}
      {isUploading && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-400">Uploading files...</span>
          </div>
        </div>
      )}
    </div>
  );
}
