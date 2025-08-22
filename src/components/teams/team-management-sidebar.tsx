"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
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
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
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

export default function TeamManagementSidebar() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Create team modal
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  // View team modal
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();

  // Fetch teams
  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
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
      fetchTeams();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setIsCreating(false);
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
      fetchTeams();
      if (selectedTeam?._id === teamId) {
        setSelectedTeam(null);
        onViewClose();
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  };

  const openTeamView = (team: Team) => {
    setSelectedTeam(team);
    onViewOpen();
  };

  if (isLoading) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
        <CardBody className="p-4">
          <div className="flex items-center justify-center h-32">
            <Icon
              icon="solar:loading-linear"
              className="animate-spin h-6 w-6 text-white"
            />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10">
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Teams</h3>
            <Button
              size="sm"
              color="success"
              variant="ghost"
              startContent={
                <Icon icon="solar:add-circle-line-duotone" width={16} />
              }
              onPress={onCreateOpen}
              className="border-green-400/30 hover:border-green-400/60"
            >
              New Team
            </Button>
          </div>

          <div className="space-y-2">
            {teams.map((team) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-white/5"
                  onPress={() => openTeamView(team)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar
                      size="sm"
                      name={team.name}
                      className="bg-gradient-to-br from-blue-400 to-purple-600"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium text-sm">
                        {team.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {team.members.length} member
                        {team.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors"
                    />
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8">
              <Icon
                icon="solar:users-group-two-rounded-linear"
                className="h-12 w-12 text-gray-400 mx-auto mb-2"
              />
              <p className="text-gray-400 text-sm">No teams found</p>
            </div>
          )}
        </CardBody>
      </Card>

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

      {/* View Team Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{selectedTeam?.name}</h3>
              <p className="text-gray-400 text-sm">
                {selectedTeam?.description}
              </p>
            </div>
            {selectedTeam && selectedTeam.slug !== "default" && (
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" size="sm" isIconOnly>
                    <Icon icon="solar:menu-dots-bold" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    onPress={() => handleDeleteTeam(selectedTeam._id)}
                  >
                    Delete Team
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </ModalHeader>
          <ModalBody className="pb-6">
            {selectedTeam && (
              <Table aria-label="Team members">
                <TableHeader>
                  <TableColumn>MEMBER</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>ROLE</TableColumn>
                </TableHeader>
                <TableBody>
                  {selectedTeam.members.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar size="sm" name={member.name} />
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400">{member.email}</span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            member.role === "admin"
                              ? "success"
                              : member.role === "member"
                              ? "primary"
                              : "default"
                          }
                          variant="flat"
                        >
                          {member.role}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
