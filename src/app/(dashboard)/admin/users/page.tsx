"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Button,
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
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  Spinner,
  Avatar,
} from "@heroui/react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "member" | "viewer";
  team?: {
    _id: string;
    name: string;
  };
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Team {
  _id: string;
  name: string;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  accessToken?: string;
  error?: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: string;
  };
  const router = useRouter();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member" as "admin" | "member" | "viewer",
    teamId: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "admin") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Fetch data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data.teams || data); // Handle both {teams: [...]} and [...] responses
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchTeams()]);
      setLoading(false);
    };

    if (session?.user && session.user.role === "admin") {
      loadData();
    }
  }, [session, fetchUsers, fetchTeams]);

  // Filter and pagination logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.active) ||
      (statusFilter === "inactive" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // CRUD Operations
  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          teamId: formData.teamId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser._id}/password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(
        `/api/admin/users/${user._id}/toggle-status`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle user status");
      }

      toast.success(
        `User ${user.active ? "deactivated" : "activated"} successfully`
      );
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle user status"
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "member",
      teamId: "",
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      teamId: user.team?._id || "",
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "danger";
      case "member":
        return "primary";
      case "viewer":
        return "secondary";
      default:
        return "default";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }
  console.log("teams:", teams);
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => setShowCreateModal(true)}
        >
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="lg:max-w-sm"
            />
            <Select
              placeholder="Filter by role"
              selectedKeys={roleFilter ? [roleFilter] : []}
              onSelectionChange={(keys) =>
                setRoleFilter(Array.from(keys)[0] as string)
              }
              className="lg:max-w-48"
            >
              <SelectItem key="all">All Roles</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
              <SelectItem key="member">Member</SelectItem>
              <SelectItem key="viewer">Viewer</SelectItem>
            </Select>
            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) =>
                setStatusFilter(Array.from(keys)[0] as string)
              }
              className="lg:max-w-48"
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Users table">
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>TEAM</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>LAST LOGIN</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No users found">
              {paginatedUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.name}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getRoleColor(user.role)}
                      variant="flat"
                      size="sm"
                      startContent={<Shield className="h-3 w-3" />}
                    >
                      {user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {user.team ? (
                      <span className="text-sm">{user.team.name}</span>
                    ) : (
                      <span className="text-sm text-gray-400">No team</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={user.active ? "success" : "danger"}
                      variant="flat"
                      size="sm"
                      startContent={
                        user.active ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )
                      }
                    >
                      {user.active ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <span className="text-sm">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="User actions">
                        <DropdownItem
                          key="edit"
                          startContent={<Edit className="h-4 w-4" />}
                          onPress={() => openEditModal(user)}
                        >
                          Edit User
                        </DropdownItem>
                        <DropdownItem
                          key="password"
                          startContent={<Key className="h-4 w-4" />}
                          onPress={() => openPasswordModal(user)}
                        >
                          Change Password
                        </DropdownItem>
                        <DropdownItem
                          key="toggle"
                          startContent={
                            user.active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )
                          }
                          onPress={() => handleToggleUserStatus(user)}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<Trash2 className="h-4 w-4" />}
                          onPress={() => openDeleteModal(user)}
                        >
                          Delete User
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create New User
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Full Name"
              placeholder="Enter user's full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              isRequired
            />
            <Input
              label="Email"
              type="email"
              placeholder="Enter user's email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              isRequired
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              }
              isRequired
            />
            <Select
              label="Role"
              placeholder="Select user role"
              selectedKeys={[formData.role]}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  role: Array.from(keys)[0] as "admin" | "member" | "viewer",
                })
              }
            >
              <SelectItem key="viewer">Viewer</SelectItem>
              <SelectItem key="member">Member</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
            </Select>
            <Select
              label="Team"
              placeholder="Select team (optional)"
              selectedKeys={formData.teamId ? [formData.teamId] : []}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  teamId: (Array.from(keys)[0] as string) || "",
                })
              }
            >
              {teams.map((team) => (
                <SelectItem key={team._id}>{team.name}</SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateUser}
              isLoading={isSubmitting}
            >
              Create User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </div>
          </ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="Full Name"
              placeholder="Enter user's full name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              isRequired
            />
            <Input
              label="Email"
              type="email"
              placeholder="Enter user's email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              isRequired
            />
            <Select
              label="Role"
              placeholder="Select user role"
              selectedKeys={[formData.role]}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  role: Array.from(keys)[0] as "admin" | "member" | "viewer",
                })
              }
            >
              <SelectItem key="viewer">Viewer</SelectItem>
              <SelectItem key="member">Member</SelectItem>
              <SelectItem key="admin">Admin</SelectItem>
            </Select>
            <Select
              label="Team"
              placeholder="Select team (optional)"
              selectedKeys={formData.teamId ? [formData.teamId] : []}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  teamId: (Array.from(keys)[0] as string) || "",
                })
              }
            >
              {teams.map((team) => (
                <SelectItem key={team._id}>{team.name}</SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateUser}
              isLoading={isSubmitting}
            >
              Update User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 mb-4">
              Changing password for: <strong>{selectedUser?.name}</strong>
            </p>
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleChangePassword}
              isLoading={isSubmitting}
            >
              Change Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-danger" />
              Delete User
            </div>
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedUser?.name}</strong>? This action cannot be
              undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteUser}
              isLoading={isSubmitting}
            >
              Delete User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
