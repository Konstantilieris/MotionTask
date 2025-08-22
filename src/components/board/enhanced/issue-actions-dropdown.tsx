"use client";

import { useState, useEffect } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  MoreHorizontal,
  Trash2,
  UserPlus,
  UserX,
  Edit,
  Copy,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { BoardIssue } from "@/types/board/types";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

interface IssueActionsDropdownProps {
  issue: BoardIssue;
  onIssueUpdate?: () => void;
}

export default function IssueActionsDropdown({
  issue,
  onIssueUpdate,
}: IssueActionsDropdownProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");

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

  const handleDeleteIssue = async () => {
    setIsDeleting(true);
    try {
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

      toast.success("Issue deleted successfully");
      setShowDeleteModal(false);
      onIssueUpdate?.();
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete issue"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignIssue = async () => {
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/issues/${issue.key}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: selectedAssignee || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign issue");
      }

      toast.success("Issue assigned successfully");
      setShowAssignModal(false);
      onIssueUpdate?.();
    } catch (error) {
      console.error("Error assigning issue:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to assign issue"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignIssue = async () => {
    try {
      const response = await fetch(`/api/issues/${issue.key}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unassign issue");
      }

      toast.success("Issue unassigned successfully");
      onIssueUpdate?.();
    } catch (error) {
      console.error("Error unassigning issue:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to unassign issue"
      );
    }
  };

  const handleCopyIssue = async () => {
    try {
      await navigator.clipboard.writeText(`${issue.key}: ${issue.summary}`);
      toast.success("Issue details copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="min-w-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3 text-neutral-400" />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Issue actions"
          className="bg-neutral-800 border border-neutral-700"
        >
          <DropdownItem
            key="edit"
            startContent={<Edit className="h-4 w-4" />}
            className="text-neutral-200 hover:bg-neutral-700"
            href={`/issues/${issue.key}/edit`}
          >
            Edit issue
          </DropdownItem>

          <DropdownItem
            key="copy"
            startContent={<Copy className="h-4 w-4" />}
            className="text-neutral-200 hover:bg-neutral-700"
            onPress={handleCopyIssue}
          >
            Copy issue details
          </DropdownItem>

          {issue.assignee ? (
            <DropdownItem
              key="unassign"
              startContent={<UserX className="h-4 w-4" />}
              className="text-neutral-200 hover:bg-neutral-700"
              onPress={handleUnassignIssue}
            >
              Unassign
            </DropdownItem>
          ) : (
            <DropdownItem
              key="assign"
              startContent={<UserPlus className="h-4 w-4" />}
              className="text-neutral-200 hover:bg-neutral-700"
              onPress={() => setShowAssignModal(true)}
            >
              Assign issue
            </DropdownItem>
          )}

          <DropdownItem
            key="archive"
            startContent={<Archive className="h-4 w-4" />}
            className="text-neutral-200 hover:bg-neutral-700"
          >
            Archive
          </DropdownItem>

          <DropdownItem
            key="delete"
            startContent={<Trash2 className="h-4 w-4" />}
            className="text-danger hover:bg-danger/20"
            color="danger"
            onPress={() => setShowDeleteModal(true)}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className="bg-neutral-900 border border-neutral-700"
      >
        <ModalContent>
          <ModalHeader className="text-neutral-100">Delete Issue</ModalHeader>
          <ModalBody className="text-neutral-300">
            <p>
              Are you sure you want to delete <strong>{issue.key}</strong>?
            </p>
            <p className="text-sm text-neutral-400">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowDeleteModal(false)}
              className="text-neutral-400"
            >
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
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        className="bg-neutral-900 border border-neutral-700"
      >
        <ModalContent>
          <ModalHeader className="text-neutral-100">Assign Issue</ModalHeader>
          <ModalBody>
            <Select
              label="Assignee"
              placeholder="Select a team member"
              selectedKeys={selectedAssignee ? [selectedAssignee] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedAssignee(selected);
              }}
              className="text-neutral-100"
            >
              {teamMembers.map((member) => (
                <SelectItem key={member._id}>
                  {member.name} ({member.email})
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowAssignModal(false)}
              className="text-neutral-400"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAssignIssue}
              isLoading={isAssigning}
              isDisabled={!selectedAssignee}
            >
              Assign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
