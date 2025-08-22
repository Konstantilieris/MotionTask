"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  members: TeamMember[];
  defaultRole: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  team?: string;
}

export default function TeamsManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create team modal
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  // Edit team modal
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");

  // Add member modal
  const {
    isOpen: isAddMemberOpen,
    onOpen: onAddMemberOpen,
    onClose: onAddMemberClose,
  } = useDisclosure();
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch teams and users
  const fetchData = async () => {
    try {
      const [teamsResponse, usersResponse] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/users"),
      ]);

      if (!teamsResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const teamsData = await teamsResponse.json();
      const usersData = await usersResponse.json();

      setTeams(teamsData.teams);
      setUsers(usersData.users);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to create team");

      toast.success("Team created successfully!");
      setNewTeamName("");
      setNewTeamDescription("");
      onCreateClose();
      fetchData();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  // Update team
  const handleUpdateTeam = async () => {
    if (!selectedTeam || !editTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editTeamName,
          description: editTeamDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to update team");

      toast.success("Team updated successfully!");
      onEditClose();
      fetchData();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete team");

      toast.success("Team deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  };

  // Add member to team
  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${selectedTeam._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!response.ok) throw new Error("Failed to add member");

      toast.success("Member added successfully!");
      setSelectedUserId("");
      onAddMemberClose();
      fetchData();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  // Remove member from team
  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error("Failed to remove member");

      toast.success("Member removed successfully!");
      fetchData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description || "");
    onEditOpen();
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setSelectedUserId("");
    onAddMemberOpen();
  };

  // Get available users (not in the selected team)
  const getAvailableUsers = () => {
    if (!selectedTeam) return [];
    const teamMemberIds = selectedTeam.members.map((m) => m._id);
    return users.filter((user) => !teamMemberIds.includes(user._id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 font-sans">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center h-64">
            <Icon
              icon="solar:loading-linear"
              className="animate-spin h-8 w-8 text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 font-sans">
        {/* Header */}
        <motion.div
          className="bg-black/30 backdrop-blur-lg border-b border-white/5 px-8 py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-light text-white tracking-tight">
              Teams Management
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage teams and members across your organization
            </p>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-light text-white tracking-wide">
                    All Teams
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {teams.length} team{teams.length !== 1 ? "s" : ""} total
                  </p>
                </div>
                <Button
                  color="success"
                  variant="ghost"
                  startContent={
                    <Icon icon="solar:add-circle-line-duotone" width={20} />
                  }
                  onPress={onCreateOpen}
                  className="border-green-400/30 hover:border-green-400/60"
                >
                  Create Team
                </Button>
              </CardHeader>
              <Divider className="bg-white/5" />
              <CardBody>
                <Table aria-label="Teams table">
                  <TableHeader>
                    <TableColumn>TEAM</TableColumn>
                    <TableColumn>MEMBERS</TableColumn>
                    <TableColumn>CREATED</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar
                              size="sm"
                              name={team.name}
                              className="bg-gradient-to-br from-blue-400 to-purple-600"
                            />
                            <div>
                              <p className="font-medium text-white">
                                {team.name}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {team.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">
                              {team.members.length}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              startContent={
                                <Icon
                                  icon="solar:user-plus-linear"
                                  width={16}
                                />
                              }
                              onPress={() => openAddMemberModal(team)}
                              className="text-gray-400 hover:text-white"
                            >
                              Add
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400">
                            {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="ghost" size="sm" isIconOnly>
                                <Icon icon="solar:menu-dots-bold" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                onPress={() => openEditModal(team)}
                              >
                                Edit Team
                              </DropdownItem>
                              {team.slug !== "default" ? (
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  onPress={() => handleDeleteTeam(team._id)}
                                >
                                  Delete Team
                                </DropdownItem>
                              ) : null}
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalContent>
          <ModalHeader>Create New Team</ModalHeader>
          <ModalBody>
            <Input
              label="Team Name"
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              variant="bordered"
              color="success"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
              }}
            />
            <Textarea
              label="Description (Optional)"
              placeholder="Enter team description"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              variant="bordered"
              color="success"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onCreateClose}>
              Cancel
            </Button>
            <Button
              color="success"
              variant="ghost"
              onPress={handleCreateTeam}
              isLoading={isCreating}
              className="border-green-400/30 hover:border-green-400/60"
            >
              Create Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Team Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent>
          <ModalHeader>Edit Team</ModalHeader>
          <ModalBody>
            <Input
              label="Team Name"
              placeholder="Enter team name"
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              variant="bordered"
              color="success"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
              }}
            />
            <Textarea
              label="Description (Optional)"
              placeholder="Enter team description"
              value={editTeamDescription}
              onChange={(e) => setEditTeamDescription(e.target.value)}
              variant="bordered"
              color="success"
              classNames={{
                input: "text-white",
                label: "text-gray-300",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onEditClose}>
              Cancel
            </Button>
            <Button
              color="success"
              variant="ghost"
              onPress={handleUpdateTeam}
              isLoading={isUpdating}
              className="border-green-400/30 hover:border-green-400/60"
            >
              Update Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={onAddMemberClose} size="lg">
        <ModalContent>
          <ModalHeader>Add Member to {selectedTeam?.name}</ModalHeader>
          <ModalBody>
            <Select
              label="Select User"
              placeholder="Choose a user to add"
              selectedKeys={selectedUserId ? [selectedUserId] : []}
              onSelectionChange={(keys) =>
                setSelectedUserId(Array.from(keys)[0] as string)
              }
              variant="bordered"
              color="success"
              classNames={{
                label: "text-gray-300",
                trigger:
                  "border-white/20 hover:border-white/40 bg-white/5 text-white",
                value: "text-white",
                popoverContent:
                  "bg-neutral-800/95 backdrop-blur-xl border-white/20",
              }}
            >
              {getAvailableUsers().map((user) => (
                <SelectItem key={user._id} textValue={user.name}>
                  <div className="flex items-center space-x-2">
                    <Avatar size="sm" name={user.name} />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onAddMemberClose}>
              Cancel
            </Button>
            <Button
              color="success"
              variant="ghost"
              onPress={handleAddMember}
              isDisabled={!selectedUserId}
              className="border-green-400/30 hover:border-green-400/60"
            >
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
