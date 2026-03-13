import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import { Plus, Power, X, Save, Smartphone, Search, FileSpreadsheet, Edit2, Check, FolderTree } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

interface Category {
    id: string;
    name: string;
    isActive: boolean;
}

interface MobileModel {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    category: {
        id: string;
        name: string;
        isActive: boolean;
    };
}

const ManageModels: React.FC = () => {
    const [models, setModels] = useState<MobileModel[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Search states
    const [searchName, setSearchName] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [modelName, setModelName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");

    // Edit model states
    const [editingModelId, setEditingModelId] = useState<string | null>(null);
    const [editingModelName, setEditingModelName] = useState("");
    const [editingCategoryId, setEditingCategoryId] = useState("");

    // Fetch all models
    const fetchModels = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/api/admin/inventory/models");
            setModels(response.data.models);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch models");
        } finally {
            setLoading(false);
        }
    };

    // Fetch active categories for add form dropdown
    const fetchCategories = async () => {
        try {
            const response = await axiosInstance.get("/api/admin/inventory/active-inventory");
            setCategories(response.data.inventory);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch categories");
        }
    };

    useEffect(() => {
        fetchModels();
        fetchCategories();
    }, []);

    // Reset form
    const resetForm = () => {
        setModelName("");
        setSelectedCategoryId("");
        setShowAddForm(false);
    };

    // Add new model
    const handleAddModel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.post(
                "/api/admin/inventory/model",
                { name: modelName, categoryId: selectedCategoryId }
            );
            toast.success("Model added successfully!");
            resetForm();
            await fetchModels();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add model");
        }
    };

    // Toggle model status
    const handleToggleStatus = async (id: string) => {
        try {
            await axiosInstance.patch(
                `/api/admin/inventory/model/status/${id}`,
                {}
            );
            toast.success("Model status updated!");
            await fetchModels();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to toggle status");
        }
    };

    // Start editing model
    const startEditModel = (model: MobileModel) => {
        setEditingModelId(model.id);
        setEditingModelName(model.name);
        setEditingCategoryId(model.category.id);
    };

    // Update model
    const handleUpdateModel = async (modelId: string) => {
        if (!editingModelName.trim()) {
            toast.error("Model name cannot be empty");
            return;
        }

        try {
            await axiosInstance.patch(
                `/api/admin/inventory/model/${modelId}`,
                {
                    name: editingModelName,
                    categoryId: editingCategoryId
                }
            );
            toast.success("Model updated successfully!");
            setEditingModelId(null);
            setEditingModelName("");
            setEditingCategoryId("");
            await fetchModels();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update model");
        }
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingModelId(null);
        setEditingModelName("");
        setEditingCategoryId("");
    };

    // Filter models based on search
    const filteredModels = models.filter((model) => {
        const matchesName =
            searchName === "" ||
            model.name.toLowerCase().includes(searchName.toLowerCase());

        const matchesCategory =
            searchCategory === "" ||
            model.category.name.toLowerCase().includes(searchCategory.toLowerCase());

        return matchesName && matchesCategory;
    });

    // Export to Excel
    const exportToExcel = () => {
        const exportData = filteredModels.map((model) => ({
            "Model Name": model.name,
            "Category": model.category.name,
            "Status": model.isActive ? "Active" : "Inactive",
            "Category Status": model.category.isActive ? "Active" : "Inactive",
            "Created Date": new Date(model.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Models");

        const columnWidths = [
            { wch: 35 }, // Model Name
            { wch: 25 }, // Category
            { wch: 12 }, // Status
            { wch: 15 }, // Category Status
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        const fileName = `Mobile_Models_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Manage <span className="text-[var(--apl-cyan)]">Models</span>
                </h1>
                <p className="text-slate-400">Manage device models across all categories</p>
            </div>

            {/* Search Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by model name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
                <div className="relative">
                    <FolderTree className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by category..."
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
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
                        Add New Model
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={filteredModels.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export models to Excel"
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
                        <h2 className="text-2xl font-bold text-white">Add New Model</h2>
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleAddModel} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <Smartphone size={16} />
                                Model Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="e.g., iPhone 15 Pro Max, Galaxy S24 Ultra"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <FolderTree size={16} />
                                Category *
                            </label>
                            <select
                                required
                                value={selectedCategoryId}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                            >
                                <option value="">Select a category...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 flex gap-3 mt-4">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                            >
                                <Save size={20} />
                                Add Model
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

            {/* Models Table */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading models...</div>
            ) : filteredModels.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {models.length === 0
                        ? "No models found. Add your first model!"
                        : "No models match your search criteria."}
                </div>
            ) : (
                <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5">
                        <p className="text-sm text-slate-400">
                            Showing <span className="text-[var(--apl-cyan)] font-semibold">{filteredModels.length}</span> of {models.length} models
                        </p>
                    </div>

                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredModels.map((model) => {
                                const isEditing = editingModelId === model.id;

                                return (
                                    <tr key={model.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editingModelName}
                                                    onChange={(e) => setEditingModelName(e.target.value)}
                                                    className="w-full max-w-xs px-2 py-1.5 text-sm rounded bg-slate-900/60 border border-[var(--apl-cyan)]/30 text-white focus:outline-none focus:border-[var(--apl-cyan)]"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdateModel(model.id);
                                                        if (e.key === "Escape") cancelEdit();
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Smartphone size={16} className="text-[var(--apl-cyan)]" />
                                                    <span className="text-white font-medium">{model.name}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <select
                                                    value={editingCategoryId}
                                                    onChange={(e) => setEditingCategoryId(e.target.value)}
                                                    className="w-full max-w-xs px-2 py-1.5 text-sm rounded bg-slate-900/60 border border-slate-700/50 text-white focus:outline-none focus:border-[var(--apl-cyan)]"
                                                >
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-slate-300">{model.category.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{new Date(model.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${model.isActive
                                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    }`}>
                                                    {model.isActive ? "Active" : "Inactive"}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${model.category.isActive
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                    }`}>
                                                    Cat: {model.category.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateModel(model.id)}
                                                            className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-all"
                                                            title="Save"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEditModel(model)}
                                                            className="p-2 hover:bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)] rounded-lg transition-all"
                                                            title="Edit model"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(model.id)}
                                                            className={`p-2 rounded-lg transition-all ${model.isActive
                                                                ? "hover:bg-red-500/10 text-red-400"
                                                                : "hover:bg-green-500/10 text-green-400"
                                                                }`}
                                                            title={model.isActive ? "Deactivate" : "Activate"}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageModels;