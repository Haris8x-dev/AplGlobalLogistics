import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Plus,
    Power,
    X,
    Save,
    Search,
    FileSpreadsheet,
    Shield,
    UserCircle,
    Edit2,
    Check,
    Key,
    Mail,
    Phone,
    User,
    Lock,
    RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

interface User {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: "ADMIN" | "EMPLOYEE";
    isActive: boolean;
    createdAt: string;
}

type TabType = "ALL" | "ADMIN" | "EMPLOYEE";

const ManageUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>("ALL");

    // Search states
    const [searchName, setSearchName] = useState("");
    const [searchEmail, setSearchEmail] = useState("");

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "EMPLOYEE" as "ADMIN" | "EMPLOYEE",
        secretCode: ""
    });

    // Edit user states
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: ""
    });

    // Role change states
    const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);
    const [newRole, setNewRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
    const [roleSecretCode, setRoleSecretCode] = useState("");

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/auth/getAuth", {
                withCredentials: true
            });

            const allUsers = [
                ...response.data.data.admins,
                ...response.data.data.employees
            ];
            setUsers(allUsers);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            password: "",
            role: "EMPLOYEE",
            secretCode: ""
        });
        setShowAddForm(false);
    };

    // Add new user
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                "http://localhost:5000/api/auth/generate",
                formData,
                { withCredentials: true }
            );
            toast.success("User created successfully!");
            resetForm();
            await fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create user");
        }
    };

    // Toggle user status
    const handleToggleStatus = async (id: string) => {
        try {
            await axios.patch(
                `http://localhost:5000/api/auth/status/${id}`,
                {},
                { withCredentials: true }
            );
            toast.success("User status updated!");
            await fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to toggle status");
        }
    };

    // Start editing user
    const startEditUser = (user: User) => {
        setEditingUserId(user.id);
        setEditFormData({
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: ""
        });
    };

    // Update user
    const handleUpdateUser = async (userId: string) => {
        try {
            const updatePayload: any = {
                fullName: editFormData.fullName,
                email: editFormData.email,
                phoneNumber: editFormData.phoneNumber
            };

            // Only include password if it's been entered
            if (editFormData.password) {
                updatePayload.password = editFormData.password;
            }

            await axios.patch(
                `http://localhost:5000/api/auth/update/${userId}`,
                updatePayload,
                { withCredentials: true }
            );
            toast.success("User updated successfully!");
            setEditingUserId(null);
            setEditFormData({
                fullName: "",
                email: "",
                phoneNumber: "",
                password: ""
            });
            await fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update user");
        }
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingUserId(null);
        setEditFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            password: ""
        });
    };

    // Start role change
    const startRoleChange = (user: User) => {
        setChangingRoleUserId(user.id);
        setNewRole(user.role === "ADMIN" ? "EMPLOYEE" : "ADMIN");
        setRoleSecretCode("");
    };

    // Update user role
    const handleUpdateRole = async () => {
        if (newRole === "ADMIN" && !roleSecretCode) {
            toast.error("Secret code is required for admin role");
            return;
        }

        try {
            const payload: any = { role: newRole };
            if (newRole === "ADMIN") {
                payload.secretCode = roleSecretCode;
            }

            await axios.patch(
                `http://localhost:5000/api/auth/update-role/${changingRoleUserId}`,
                payload,
                { withCredentials: true }
            );
            toast.success("User role updated successfully!");
            setChangingRoleUserId(null);
            setRoleSecretCode("");
            await fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update role");
        }
    };

    // Cancel role change
    const cancelRoleChange = () => {
        setChangingRoleUserId(null);
        setRoleSecretCode("");
    };

    // Filter users based on tab and search
    const filteredUsers = users.filter((user) => {
        const matchesTab =
            activeTab === "ALL" ||
            (activeTab === "ADMIN" && user.role === "ADMIN") ||
            (activeTab === "EMPLOYEE" && user.role === "EMPLOYEE");

        const matchesName =
            searchName === "" ||
            user.fullName.toLowerCase().includes(searchName.toLowerCase());

        const matchesEmail =
            searchEmail === "" ||
            user.email.toLowerCase().includes(searchEmail.toLowerCase());

        return matchesTab && matchesName && matchesEmail;
    });

    // Export to Excel
    const exportToExcel = () => {
        const exportData = filteredUsers.map((user) => ({
            "Full Name": user.fullName,
            "Email": user.email,
            "Phone Number": user.phoneNumber,
            "Role": user.role,
            "Status": user.isActive ? "Active" : "Inactive",
            "Created Date": new Date(user.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

        const columnWidths = [
            { wch: 25 }, // Full Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone Number
            { wch: 12 }, // Role
            { wch: 10 }, // Status
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        const fileName = `Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Manage <span className="text-[var(--apl-cyan)]">Users</span>
                </h1>
                <p className="text-slate-400">Manage system users and permissions</p>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex items-center gap-2">
                <button
                    onClick={() => setActiveTab("ALL")}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === "ALL"
                        ? "bg-[var(--apl-cyan)] text-white"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
                        }`}
                >
                    All Users ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab("ADMIN")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === "ADMIN"
                        ? "bg-[var(--apl-cyan)] text-white"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
                        }`}
                >
                    <Shield size={18} />
                    Admins ({users.filter(u => u.role === "ADMIN").length})
                </button>
                <button
                    onClick={() => setActiveTab("EMPLOYEE")}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === "EMPLOYEE"
                        ? "bg-[var(--apl-cyan)] text-white"
                        : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/50"
                        }`}
                >
                    <UserCircle size={18} />
                    Employees ({users.filter(u => u.role === "EMPLOYEE").length})
                </button>
            </div>

            {/* Search Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            {!showAddForm && (
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                    >
                        <Plus size={20} />
                        Add New User
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={filteredUsers.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export users to Excel"
                    >
                        <FileSpreadsheet size={20} />
                        Export to Excel
                    </button>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Add New User</h2>
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <User size={16} />
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Mail size={16} />
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Phone size={16} />
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="+1 234 567 8900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Lock size={16} />
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Shield size={16} />
                                Role *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as "ADMIN" | "EMPLOYEE" })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        {formData.role === "ADMIN" && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Key size={16} />
                                    Secret Code *
                                </label>
                                <input
                                    type="password"
                                    required={formData.role === "ADMIN"}
                                    value={formData.secretCode}
                                    onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                    placeholder="Admin secret code"
                                />
                            </div>
                        )}

                        <div className="md:col-span-2 flex gap-3 mt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                            >
                                <Save size={20} />
                                Create User
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {users.length === 0
                        ? "No users found. Add your first user!"
                        : "No users match your search criteria."}
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <p className="text-sm text-slate-400">
                            Showing <span className="text-[var(--apl-cyan)] font-semibold">{filteredUsers.length}</span> of {users.length} users
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredUsers.map((user) => {
                            const isEditing = editingUserId === user.id;
                            const isChangingRole = changingRoleUserId === user.id;

                            return (
                                <div
                                    key={user.id}
                                    className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:border-[var(--apl-cyan)]/20 transition-all"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${user.role === "ADMIN"
                                                ? "bg-purple-500/10"
                                                : "bg-[var(--apl-cyan)]/10"
                                                }`}>
                                                {user.role === "ADMIN" ? (
                                                    <Shield size={16} className="text-purple-400" />
                                                ) : (
                                                    <UserCircle size={16} className="text-[var(--apl-cyan)]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-white truncate">{user.fullName}</h3>
                                                <p className="text-[10px] text-slate-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {!isEditing && !isChangingRole && (
                                            <button
                                                onClick={() => startEditUser(user)}
                                                className="p-1 hover:bg-white/5 rounded transition-all"
                                                title="Edit user"
                                            >
                                                <Edit2 size={14} className="text-slate-400" />
                                            </button>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    {!isEditing && !isChangingRole && (
                                        <>
                                            <div className="space-y-1.5 mb-3">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Mail size={12} className="text-slate-500" />
                                                    <span className="text-slate-300 truncate">{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Phone size={12} className="text-slate-500" />
                                                    <span className="text-slate-300">{user.phoneNumber}</span>
                                                </div>
                                            </div>

                                            {/* Role & Status Badges */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${user.role === "ADMIN"
                                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    }`}>
                                                    {user.role}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${user.isActive
                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    }`}>
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => startRoleChange(user)}
                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-all text-xs"
                                                >
                                                    <RefreshCw size={14} />
                                                    Change Role
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs ${user.isActive
                                                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                        }`}
                                                >
                                                    <Power size={14} />
                                                    {user.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* Edit Form */}
                                    {isEditing && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editFormData.fullName}
                                                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] outline-none"
                                                placeholder="Full Name"
                                            />
                                            <input
                                                type="email"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] outline-none"
                                                placeholder="Email"
                                            />
                                            <input
                                                type="tel"
                                                value={editFormData.phoneNumber}
                                                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] outline-none"
                                                placeholder="Phone Number"
                                            />
                                            <input
                                                type="password"
                                                value={editFormData.password}
                                                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] outline-none"
                                                placeholder="New Password (optional)"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdateUser(user.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-all text-xs"
                                                >
                                                    <Check size={12} />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-xs"
                                                >
                                                    <X size={12} />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Role Change Form */}
                                    {isChangingRole && (
                                        <div className="space-y-2">
                                            <div className="p-2 bg-slate-900/60 rounded-lg">
                                                <p className="text-xs text-slate-400 mb-1">Change role to:</p>
                                                <p className="text-sm font-bold text-[var(--apl-cyan)]">
                                                    {newRole === "ADMIN" ? "Admin" : "Employee"}
                                                </p>
                                            </div>
                                            {newRole === "ADMIN" && (
                                                <input
                                                    type="password"
                                                    value={roleSecretCode}
                                                    onChange={(e) => setRoleSecretCode(e.target.value)}
                                                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] outline-none"
                                                    placeholder="Admin Secret Code *"
                                                />
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleUpdateRole}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-all text-xs"
                                                >
                                                    <Check size={12} />
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={cancelRoleChange}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all text-xs"
                                                >
                                                    <X size={12} />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageUsers;