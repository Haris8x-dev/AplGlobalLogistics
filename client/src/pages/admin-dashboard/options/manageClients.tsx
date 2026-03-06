import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Power, X, Save, Building2, User, Mail, Phone, MapPin, Briefcase, Search, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

interface Client {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    industry?: string;
    isActive: boolean;
    createdAt: string;
}

interface ClientFormData {
    companyName: string;
    contactName: string;
    email: string;
    phoneNumber: string;
    address: string;
    industry: string;
}

const ManageClients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Search states
    const [searchName, setSearchName] = useState("");
    const [searchEmail, setSearchEmail] = useState("");

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientFormData>({
        companyName: "",
        contactName: "",
        email: "",
        phoneNumber: "",
        address: "",
        industry: ""
    });

    // Fetch all clients
    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/admin/clients/all", {
                withCredentials: true
            });
            setClients(response.data.clients);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({
            companyName: "",
            contactName: "",
            email: "",
            phoneNumber: "",
            address: "",
            industry: ""
        });
        setShowAddForm(false);
        setEditingClient(null);
    };

    // Add new client
    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:5000/api/admin/clients/add", formData, {
                withCredentials: true
            });
            toast.success("Client added successfully!");
            resetForm();
            fetchClients();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add client");
        }
    };

    // Update client
    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        try {
            await axios.patch(
                `http://localhost:5000/api/admin/clients/update/${editingClient.id}`,
                formData,
                { withCredentials: true }
            );
            toast.success("Client updated successfully!");
            resetForm();
            fetchClients();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update client");
        }
    };

    // Toggle client status
    const handleToggleStatus = async (id: string) => {
        try {
            await axios.patch(
                `http://localhost:5000/api/admin/clients/status/${id}`,
                {},
                { withCredentials: true }
            );
            toast.success("Client status updated!");
            fetchClients();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to toggle status");
        }
    };

    // Start editing
    const startEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            companyName: client.companyName,
            contactName: client.contactName,
            email: client.email,
            phoneNumber: client.phoneNumber,
            address: client.address || "",
            industry: client.industry || ""
        });
        setShowAddForm(false);
    };

    // Filter clients based on search terms
    const filteredClients = clients.filter((client) => {
        const matchesName =
            searchName === "" ||
            client.companyName.toLowerCase().includes(searchName.toLowerCase()) ||
            client.contactName.toLowerCase().includes(searchName.toLowerCase());

        const matchesEmail =
            searchEmail === "" ||
            client.email.toLowerCase().includes(searchEmail.toLowerCase());

        return matchesName && matchesEmail;
    });

    // Export to Excel
    const exportToExcel = () => {
        // Prepare data for export
        const exportData = clients.map((client) => ({
            "Company Name": client.companyName,
            "Contact Name": client.contactName,
            "Email": client.email,
            "Phone Number": client.phoneNumber,
            "Address": client.address || "N/A",
            "Industry": client.industry || "N/A",
            "Status": client.isActive ? "Active" : "Inactive",
            "Created Date": new Date(client.createdAt).toLocaleDateString()
        }));

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        // Set column widths for better readability
        const columnWidths = [
            { wch: 30 }, // Company Name
            { wch: 25 }, // Contact Name
            { wch: 30 }, // Email
            { wch: 20 }, // Phone Number
            { wch: 35 }, // Address
            { wch: 20 }, // Industry
            { wch: 10 }, // Status
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        // Generate filename with current date
        const fileName = `Clients_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Manage <span className="text-[var(--apl-cyan)]">Clients</span>
                </h1>
                <p className="text-slate-400">Add, edit, and manage your client portfolio</p>
            </div>

            {/* Search Filters */}
            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by company or contact name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by email address..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Add Client Button */}
            {!showAddForm && !editingClient && (
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                    >
                        <Plus size={20} />
                        Add New Client
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={clients.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export all clients to Excel"
                    >
                        <FileSpreadsheet size={20} />
                        Export as Excel
                    </button>
                </div>
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingClient) && (
                <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {editingClient ? "Edit Client" : "Add New Client"}
                        </h2>
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={editingClient ? handleUpdateClient : handleAddClient} className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Building2 size={16} />
                                Company Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="Acme Corporation"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <User size={16} />
                                Contact Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
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
                                placeholder="john@acme.com"
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
                                <MapPin size={16} />
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="123 Business St, City"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Briefcase size={16} />
                                Industry
                            </label>
                            <input
                                type="text"
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="Technology, Healthcare, etc."
                            />
                        </div>

                        <div className="col-span-2 flex gap-3 mt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                            >
                                <Save size={20} />
                                {editingClient ? "Update Client" : "Add Client"}
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

            {/* Clients Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {clients.length === 0
                        ? "No clients found. Add your first client!"
                        : "No clients match your search criteria."}
                </div>
            ) : (
                <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5">
                        <p className="text-sm text-slate-400">
                            Showing <span className="text-[var(--apl-cyan)] font-semibold">{filteredClients.length}</span> of {clients.length} clients
                        </p>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Industry</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-white font-medium">{client.companyName}</div>
                                        {client.address && <div className="text-xs text-slate-400">{client.address}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{client.contactName}</td>
                                    <td className="px-6 py-4 text-slate-300">{client.email}</td>
                                    <td className="px-6 py-4 text-slate-300">{client.phoneNumber}</td>
                                    <td className="px-6 py-4 text-slate-300">{client.industry || "—"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${client.isActive
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}>
                                            {client.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => startEdit(client)}
                                                className="p-2 hover:bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)] rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(client.id)}
                                                className={`p-2 rounded-lg transition-all ${client.isActive
                                                    ? "hover:bg-red-500/10 text-red-400"
                                                    : "hover:bg-green-500/10 text-green-400"
                                                    }`}
                                                title={client.isActive ? "Deactivate" : "Activate"}
                                            >
                                                <Power size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageClients;