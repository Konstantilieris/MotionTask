"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import { showSuccess, showError } from "@/components/shared/Toast";

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
}

interface CommentsProps {
  issueId: string;
}

function CommentItem({
  comment,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  onEdit: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - commentDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return commentDate.toLocaleDateString();
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== comment.content) {
      onEdit(comment._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg hover:bg-gray-800/50 transition-colors group">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
        {comment.author.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-200">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-500 italic">(edited)</span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-gray-300 transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(comment._id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
              rows={3}
              placeholder="Edit your comment..."
              aria-label="Edit comment"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 border border-gray-600 text-gray-300 text-xs rounded hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Comments({ issueId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/issues/${issueId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          // For now, show empty state when API is not available
          setComments([]);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [issueId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [...prev, newCommentData]);
        setNewComment("");
        showSuccess("Comment added successfully");
      } else {
        showError("Failed to add comment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
      showError("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const response = await fetch(
        `/api/issues/${issueId}/comments/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent }),
        }
      );

      if (response.ok) {
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId ? { ...updatedComment, isEdited: true } : c
          )
        );
        showSuccess("Comment updated successfully");
      } else {
        showError("Failed to update comment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to edit comment:", error);
      showError("Failed to update comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/issues/${issueId}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        showSuccess("Comment deleted successfully");
      } else {
        showError("Failed to delete comment. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      showError("Failed to delete comment. Please try again.");
    }
  };

  return (
    <section
      aria-label="Comments"
      className="space-y-4 rounded-xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-100">
          Comments ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 placeholder-gray-400"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Posting..." : "Comment"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex gap-3 p-4 bg-gray-800/30 rounded-lg"
            >
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Be the first to add a comment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}
