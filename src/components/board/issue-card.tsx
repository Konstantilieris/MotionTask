"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  Bug,
  CheckSquare,
  Circle,
  AlertTriangle,
  User,
  MoreHorizontal,
  Trash2,
  UserPlus,
  UserX,
} from "lucide-react";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from "@heroui/react";
import { assignIssue } from "@/lib/actions/issue-actions";
import { toast } from "sonner";

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
  };
  reporter: {
    name: string;
    email: string;
  };
}

interface IssueCardProps {
  issue: Issue;
  isDragging?: boolean;
  onDelete?: (issueId: string) => void;
  onAssign?: (issueId: string, assigneeId: string | null) => void;
}

const typeIcons = {
  task: CheckSquare,
  bug: Bug,
  story: Circle,
  epic: AlertTriangle,
};

const priorityColors = {
  low: "border-l-gray-400",
  medium: "border-l-yellow-400",
  high: "border-l-orange-400",
  critical: "border-l-red-400",
};

export default function IssueCard({
  issue,
  isDragging = false,
  onDelete,
  onAssign,
}: IssueCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ _id: string; name: string; email: string }>
  >([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: issue._id,
  });

  // Fetch team members when assignment modal opens
  useEffect(() => {
    if (showAssignModal) {
      fetchTeamMembers();
    }
  }, [showAssignModal]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/users/team");
      if (response.ok) {
        const { users } = await response.json();
        setTeamMembers(users);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const dragStyle =
    isDragging || isSortableDragging ? "rotate-3 scale-105 opacity-50" : "";
  const TypeIcon = typeIcons[issue.type as keyof typeof typeIcons] || Circle;

  const handleDeleteIssue = async () => {
    setIsDeleting(true);

    try {
      // Call the API endpoint directly for more reliable deletion
      const response = await fetch(`/api/issues/${issue.key}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete issue");
      }

      // Only update UI after successful API call
      toast.success("Issue deleted successfully");
      setShowDeleteModal(false);

      // Optimistic update - remove from UI after successful deletion
      if (onDelete) {
        onDelete(issue._id);
      }
    } catch (error: unknown) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete issue"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignIssue = async (assigneeId: string | null) => {
    setIsAssigning(true);

    // Optimistic update
    if (onAssign) {
      onAssign(issue._id, assigneeId);
    }

    try {
      await assignIssue(issue._id, assigneeId);
      toast.success(
        assigneeId
          ? "Issue assigned successfully"
          : "Issue unassigned successfully"
      );
      setShowAssignModal(false);
    } catch (error: unknown) {
      toast.error("Failed to update assignment");
      // Revert optimistic update by calling onAssign with the original assignee
      if (onAssign) {
        onAssign(issue._id, issue.assignee?.email || null);
      }
      console.error("Assignment error:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-dark-200 rounded-lg border border-gray-a8 p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer
        border-l-4 ${
          priorityColors[issue.priority as keyof typeof priorityColors] ||
          "border-l-dark-100"
        }
        ${dragStyle}
      `}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition: transition || undefined,
      }}
      {...attributes}
      {...listeners}
    >
      <Link href={`/issues/${issue.key}`} className="block">
        <div className="space-y-1.5 sm:space-y-2">
          {/* Issue Type and Key */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <TypeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                {issue.key}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {issue.storyPoints && (
                <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
                  {issue.storyPoints}
                </span>
              )}
              {/* Actions Dropdown */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="h-6 w-6 min-w-6 text-gray-400 hover:text-gray-600"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="assign"
                    startContent={
                      issue.assignee ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )
                    }
                    onClick={() => setShowAssignModal(true)}
                  >
                    {issue.assignee ? "Unassign" : "Assign"}
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash2 className="h-4 w-4" />}
                    className="text-danger"
                    color="danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          {/* Issue Title */}
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            {issue.title}
          </h4>

          {/* Issue Description (if present) */}
          {issue.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {issue.description}
            </p>
          )}

          {/* Issue Meta */}
          <div className="flex items-center justify-between pt-1 sm:pt-2">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span
                className={`
                inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full
                ${
                  issue.priority === "critical"
                    ? "bg-red-100 text-red-800"
                    : issue.priority === "high"
                    ? "bg-orange-100 text-orange-800"
                    : issue.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }
              `}
              >
                {issue.priority}
              </span>
            </div>

            {/* Assignee */}
            <div className="flex items-center space-x-1">
              {issue.assignee ? (
                <div
                  className="flex items-center space-x-1"
                  title={issue.assignee.name}
                >
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate max-w-[50px] sm:max-w-[60px]">
                    {issue.assignee.name.split(" ")[0]}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1" title="Unassigned">
                  <User className="h-3 w-3 text-gray-300" />
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    Unassigned
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Delete Issue</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete issue <strong>{issue.key}</strong>
              ?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteIssue}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assignment Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <ModalContent>
          <ModalHeader>
            {issue.assignee ? "Change Assignment" : "Assign Issue"}
          </ModalHeader>
          <ModalBody>
            {issue.assignee && (
              <p className="mb-4">
                Currently assigned to <strong>{issue.assignee.name}</strong>
              </p>
            )}
            <Select
              label="Assignee"
              placeholder="Select an assignee"
              selectedKeys={selectedAssignee ? [selectedAssignee] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedAssignee(selected);
              }}
              items={[
                { _id: "", name: "Unassigned", email: "" },
                ...teamMembers,
              ]}
            >
              {(member) => (
                <SelectItem key={member._id}>
                  {member._id === ""
                    ? member.name
                    : `${member.name} (${member.email})`}
                </SelectItem>
              )}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => handleAssignIssue(selectedAssignee || null)}
              isLoading={isAssigning}
            >
              {selectedAssignee ? "Assign" : "Unassign"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
