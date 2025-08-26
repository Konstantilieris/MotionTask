"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Select,
  SelectItem,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE } from "@/types/roles";

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
  avatar?: string;
  defaultRole: string;
  members: TeamMember[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TeamsManagementPage: React.FC = () => {
  // Core state
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletedFilter, setDeletedFilter] = useState("false");
  const [currentPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    avatar: "",
    defaultRole: ROLE.MEMBER as string,
    members: [] as string[],
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        page: currentPage.toString(),
        limit: "10",
        deleted: deletedFilter,
      });

      const response = await fetch(`/api/teams?${params}`);
      if (!response.ok) throw new Error("Failed to fetch teams");

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, deletedFilter]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    // Users fetching would be implemented for member management features
  }, []);

  // Initialize
  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, [fetchTeams, fetchUsers]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      avatar: "",
      defaultRole: ROLE.MEMBER as string,
      members: [],
    });
    setIsDirty(false);
  };

  // Handle form changes
  const handleFormChange = (field: string, value: string | string[]) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "name") {
        newData.slug = generateSlug(value as string);
      }
      return newData;
    });
    setIsDirty(true);
  };

  // Validate form
  const validateForm = (): string | null => {
    if (
      !formData.name.trim() ||
      formData.name.trim().length < 2 ||
      formData.name.trim().length > 60
    ) {
      return "Name must be between 2 and 60 characters";
    }
    if (!formData.slug.trim() || !/^[a-z0-9-]{2,64}$/.test(formData.slug)) {
      return "Slug must be 2-64 characters with only lowercase letters, numbers, and hyphens";
    }
    if (formData.avatar && !formData.avatar.startsWith("https://")) {
      return "Avatar must be a valid HTTPS URL";
    }
    return null;
  };

  // Create team
  const handleCreateTeam = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const data = await response.json();
      toast.success(data.message || "Team created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create team"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update team
  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/teams/${selectedTeam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team");
      }

      const data = await response.json();
      toast.success(data.message || "Team updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update team"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete/Restore team
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      setIsSubmitting(true);
      let response;

      if (selectedTeam.deletedAt) {
        response = await fetch(`/api/teams/${selectedTeam._id}/restore`, {
          method: "POST",
        });
      } else {
        response = await fetch(`/api/teams/${selectedTeam._id}`, {
          method: "DELETE",
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      const data = await response.json();
      toast.success(data.message);
      setShowDeleteModal(false);
      fetchTeams();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      slug: team.slug,
      description: team.description || "",
      avatar: team.avatar || "",
      defaultRole: team.defaultRole,
      members: team.members.map((m) => m._id),
    });
    setIsDirty(false);
    setShowEditModal(true);
  };

  const openDeleteModal = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  // Handle modal close with dirty check
  const handleModalClose = (modalSetter: (value: boolean) => void) => {
    if (isDirty && !window.confirm("You have unsaved changes. Close anyway?")) {
      return;
    }
    modalSetter(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Teams Management</h1>
            <p className="text-gray-400 mt-1">
              Manage your organization&apos;s teams and members
            </p>
          </div>
          <Button
            color="primary"
            variant="solid"
            startContent={<Plus className="h-4 w-4" />}
            onPress={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            New Team
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardBody>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-gray-400" />}
                  variant="bordered"
                  classNames={{
                    input: "text-white placeholder-gray-400",
                    inputWrapper:
                      "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  }}
                />
              </div>
              <Select
                placeholder="Filter by status"
                selectedKeys={new Set([deletedFilter])}
                onSelectionChange={(keys) =>
                  setDeletedFilter(Array.from(keys)[0] as string)
                }
                className="min-w-[200px]"
                variant="bordered"
                classNames={{
                  trigger:
                    "border-white/20 bg-white/5 hover:border-white/30 data-[open]:border-blue-500",
                  value: "text-light-100",

                  listbox: "bg-gray-800",
                  popoverContent: "bg-gray-800 border-white/20",
                }}
              >
                <SelectItem key="false">Active Teams</SelectItem>
                <SelectItem key="true">Deleted Teams</SelectItem>
                <SelectItem key="all">All Teams</SelectItem>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Teams Table */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center p-8">
                <Spinner color="primary" />
              </div>
            ) : (
              <Table
                aria-label="Teams table"
                className="min-h-[400px]"
                classNames={{
                  wrapper: "bg-transparent shadow-none",
                  th: "bg-white/5 text-gray-300 border-b border-white/10",
                  td: "border-b border-white/5 text-gray-200",
                }}
              >
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>SLUG</TableColumn>
                  <TableColumn>MEMBERS</TableColumn>
                  <TableColumn>DEFAULT ROLE</TableColumn>
                  <TableColumn>UPDATED</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No teams found">
                  {teams.map((team) => (
                    <TableRow key={team._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={team.avatar}
                            name={team.name}
                            size="sm"
                            className="text-white bg-blue-600"
                          />
                          <div>
                            <p className="font-medium text-white">
                              {team.name}
                            </p>
                            {team.description && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {team.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-gray-300">
                          {team.slug}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-white/10 text-gray-200"
                        >
                          {team.members.length}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            team.defaultRole === ROLE.ADMIN
                              ? "danger"
                              : team.defaultRole === ROLE.MEMBER
                              ? "primary"
                              : "secondary"
                          }
                          variant="flat"
                        >
                          {team.defaultRole}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-400">
                          {new Date(team.updatedAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={team.deletedAt ? "danger" : "success"}
                          variant="flat"
                        >
                          {team.deletedAt ? "Deleted" : "Active"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              className="text-gray-400 hover:text-gray-200 hover:bg-white/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Team actions"
                            className="bg-gray-800 border border-white/20"
                          >
                            {!team.deletedAt ? (
                              <DropdownItem
                                key="edit"
                                startContent={<Edit className="h-4 w-4" />}
                                onPress={() => openEditModal(team)}
                                className="text-gray-200 hover:text-white hover:bg-white/10"
                              >
                                Edit Team
                              </DropdownItem>
                            ) : null}
                            <DropdownItem
                              key="delete"
                              startContent={
                                team.deletedAt ? (
                                  <RotateCcw className="h-4 w-4" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )
                              }
                              onPress={() => openDeleteModal(team)}
                              className={
                                team.deletedAt
                                  ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              }
                            >
                              {team.deletedAt ? "Restore Team" : "Delete Team"}
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => handleModalClose(setShowCreateModal)}
          size="2xl"
          classNames={{
            backdrop: "bg-black/50 backdrop-blur-sm",
            base: "bg-gray-900 border border-white/20",
            header: "border-b border-white/10 bg-gray-900 text-white",
            body: "bg-gray-900 text-gray-100",
            footer: "border-t border-white/10 bg-gray-900",
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Create New Team
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Team Name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                }}
              />
              <Input
                label="Slug"
                placeholder="team-slug"
                value={formData.slug}
                onChange={(e) => handleFormChange("slug", e.target.value)}
                description="URL-friendly identifier (auto-generated from name)"
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400 font-mono",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                  description: "text-gray-400",
                }}
              />
              <Textarea
                label="Description"
                placeholder="Team description (optional)"
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                }}
              />
              <Select
                label="Default Role"
                placeholder="Select default role for new members"
                selectedKeys={new Set([formData.defaultRole])}
                onSelectionChange={(keys) =>
                  handleFormChange("defaultRole", Array.from(keys)[0] as string)
                }
                isRequired
                variant="bordered"
                classNames={{
                  trigger:
                    "border-white/20 bg-white/5 hover:border-white/30 data-[open]:border-blue-500",
                  value: "text-white",
                  label: "text-gray-300",
                  listbox: "bg-gray-800",
                  popoverContent: "bg-gray-800 border-white/20",
                }}
              >
                {Object.values(ROLE).map((role) => (
                  <SelectItem key={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => handleModalClose(setShowCreateModal)}
                className="text-gray-400 hover:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleCreateTeam}
                isLoading={isSubmitting}
                isDisabled={!formData.name.trim() || !formData.slug.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Team
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            if (isDirty && !confirm("You have unsaved changes. Close anyway?"))
              return;
            setShowEditModal(false);
            resetForm();
          }}
          size="2xl"
          classNames={{
            backdrop: "bg-black/50 backdrop-blur-sm",
            base: "bg-gray-900 border border-white/20",
            header: "border-b border-white/10 bg-gray-900 text-white",
            body: "bg-gray-900 text-gray-100",
            footer: "border-t border-white/10 bg-gray-900",
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2 text-white">
                <Edit className="h-5 w-5" />
                Edit Team
              </div>
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Team Name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                }}
              />
              <Input
                label="Slug"
                placeholder="team-slug"
                value={formData.slug}
                onChange={(e) => handleFormChange("slug", e.target.value)}
                description="URL-friendly identifier"
                isRequired
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400 font-mono",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                  description: "text-gray-400",
                }}
              />
              <Textarea
                label="Description"
                placeholder="Team description (optional)"
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                variant="bordered"
                classNames={{
                  input: "text-white placeholder-gray-400",
                  inputWrapper:
                    "border-white/20 bg-white/5 hover:border-white/30 focus-within:border-blue-500",
                  label: "text-gray-300",
                }}
              />
              <Select
                label="Default Role"
                placeholder="Select default role for new members"
                selectedKeys={new Set([formData.defaultRole])}
                onSelectionChange={(keys) =>
                  handleFormChange("defaultRole", Array.from(keys)[0] as string)
                }
                isRequired
                variant="bordered"
                classNames={{
                  trigger:
                    "border-white/20 bg-white/5 hover:border-white/30 data-[open]:border-blue-500",
                  value: "text-white",
                  label: "text-gray-300",
                  listbox: "bg-gray-800",
                  popoverContent: "bg-gray-800 border-white/20",
                }}
              >
                {Object.values(ROLE).map((role) => (
                  <SelectItem key={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => {
                  if (
                    isDirty &&
                    !confirm("You have unsaved changes. Close anyway?")
                  )
                    return;
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleUpdateTeam}
                isLoading={isSubmitting}
                isDisabled={!formData.name.trim() || !formData.slug.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update Team
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          size="md"
          classNames={{
            backdrop: "bg-black/50 backdrop-blur-sm",
            base: "bg-gray-900 border border-white/20",
            header: "border-b border-white/10 bg-gray-900 text-white",
            body: "bg-gray-900 text-gray-100",
            footer: "border-t border-white/10 bg-gray-900",
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2 text-white">
                {selectedTeam?.deletedAt ? (
                  <RotateCcw className="h-5 w-5" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                {selectedTeam?.deletedAt ? "Restore Team" : "Delete Team"}
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-300">
                {selectedTeam?.deletedAt
                  ? `Are you sure you want to restore "${selectedTeam?.name}"?`
                  : `Are you sure you want to delete "${selectedTeam?.name}"? This action can be undone by restoring the team later.`}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                Cancel
              </Button>
              <Button
                color={selectedTeam?.deletedAt ? "success" : "danger"}
                onPress={handleDeleteTeam}
                isLoading={isSubmitting}
                className={
                  selectedTeam?.deletedAt
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {selectedTeam?.deletedAt ? "Restore" : "Delete"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default TeamsManagementPage;
