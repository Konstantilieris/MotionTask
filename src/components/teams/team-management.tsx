"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Plus, MoreHorizontal, UserPlus, UserMinus, Crown } from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Team {
  _id: string;
  name: string;
  slug: string;
  members: TeamMember[];
}

interface TeamManagementProps {
  team: Team;
  userRole: string;
  onTeamUpdate?: () => void;
}

export default function TeamManagement({
  team,
  userRole,
  onTeamUpdate,
}: TeamManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${team._id}/available-users`);
      if (response.ok) {
        const users = await response.json();
        console.log("Available users:", users);
      }
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  }, [team._id]);

  useEffect(() => {
    if (isAddModalOpen) {
      fetchAvailableUsers();
    }
  }, [isAddModalOpen, fetchAvailableUsers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsLoading(true);
    try {
      toast.loading("Adding member...");

      const response = await fetch(`/api/teams/${team._id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add member");
      }

      toast.dismiss();
      toast.success("Member added successfully!");

      setEmail("");
      setSelectedRole("member");
      setIsAddModalOpen(false);
      onTeamUpdate?.();
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add member";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${memberName} from the team?`)
    ) {
      return;
    }

    try {
      toast.loading("Removing member...");

      const response = await fetch(
        `/api/teams/${team._id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      toast.dismiss();
      toast.success("Member removed successfully!");
      onTeamUpdate?.();
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to remove member";
      toast.error(errorMsg);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      toast.loading("Updating role...");

      const response = await fetch(
        `/api/teams/${team._id}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      toast.dismiss();
      toast.success("Role updated successfully!");
      onTeamUpdate?.();
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update role";
      toast.error(errorMsg);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "danger" as const;
      case "member":
        return "primary" as const;
      case "viewer":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  const roleOptions = [
    { key: "admin", label: "Admin" },
    { key: "member", label: "Member" },
    { key: "viewer", label: "Viewer" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <p className="text-gray-400 text-sm">
            Manage your team members and their roles
          </p>
        </div>
        {userRole === "admin" && (
          <Button
            color="success"
            variant="ghost"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setIsAddModalOpen(true)}
            className="border-green-400/30 hover:border-green-400/60"
          >
            Add Member
          </Button>
        )}
      </div>

      <Table
        aria-label="Team members table"
        classNames={{
          wrapper:
            "bg-white/10 backdrop-blur-md border border-white/20 rounded-lg",
          th: "bg-gray-50/10 text-gray-300",
          td: "text-gray-100",
        }}
      >
        <TableHeader>
          <TableColumn>MEMBER</TableColumn>
          <TableColumn>ROLE</TableColumn>
          <TableColumn>JOINED</TableColumn>
          <TableColumn align="end">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {team.members.map((member) => (
            <TableRow key={member._id}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-100">{member.name}</div>
                  <div className="text-sm text-gray-400">{member.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getRoleColor(member.role)}
                  variant="flat"
                  startContent={
                    member.role === "admin" ? (
                      <Crown className="h-3 w-3" />
                    ) : undefined
                  }
                >
                  {member.role}
                </Chip>
              </TableCell>
              <TableCell className="text-gray-400">
                {new Date(member.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {userRole === "admin" && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-gray-400 hover:text-gray-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Member actions">
                      <DropdownItem
                        key="change-role"
                        startContent={<UserPlus className="h-4 w-4" />}
                        onPress={() => {
                          const newRole = prompt(
                            "Enter new role (admin, member, viewer):",
                            member.role
                          );
                          if (newRole && newRole !== member.role) {
                            handleRoleChange(member._id, newRole);
                          }
                        }}
                      >
                        Change Role
                      </DropdownItem>
                      <DropdownItem
                        key="remove"
                        className="text-danger"
                        color="danger"
                        startContent={<UserMinus className="h-4 w-4" />}
                        onPress={() =>
                          handleRemoveMember(member._id, member.name)
                        }
                      >
                        Remove Member
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isLoading && setIsAddModalOpen(false)}
        className="dark h-[40vh] font-sans"
        size="lg"
        backdrop="blur"
      >
        <ModalContent>
          <form onSubmit={handleAddMember}>
            <ModalHeader className="flex flex-col gap-1">
              Add Team Member
            </ModalHeader>
            <ModalBody>
              <Input
                label="Email Address"
                color="success"
                placeholder="Enter member's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  input: "text-white",
                  label: "text-gray-300",
                }}
              />

              <Select
                label="Role"
                color="success"
                placeholder="Select role"
                selectedKeys={[selectedRole]}
                onSelectionChange={(keys) =>
                  setSelectedRole(Array.from(keys)[0] as string)
                }
                isDisabled={isLoading}
                variant="bordered"
                classNames={{
                  label: "text-gray-300",
                  value: "text-white",
                  base: "bg-neutral-900 text-white rounded-lg",
                  popoverContent: "bg-neutral-700 text-white rounded-lg",
                  listboxWrapper: "bg-neutral-900 text-white rounded-lg",
                  listbox: "bg-neutral-900 text-white rounded-lg",
                }}
              >
                {roleOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    color="default"
                    variant="bordered"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="ghost"
                onPress={() => setIsAddModalOpen(false)}
                isDisabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                color="success"
                variant="ghost"
                type="submit"
                isLoading={isLoading}
                isDisabled={!email.trim()}
              >
                {isLoading ? "Adding..." : "Add Member"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
