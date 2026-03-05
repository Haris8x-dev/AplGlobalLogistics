import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Power, X, Save, FolderTree, Search, FileSpreadsheet, ChevronDown, ChevronUp, Edit2, Check } from "lucide-react";
import * as XLSX from "xlsx";

interface Model {
    id: string;
    name: string;
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    models: Model[];
}

const ManageCat: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Search states
    const [searchName, setSearchName] = useState("");

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [categoryName, setCategoryName] = useState("");

    // Expanded categories to show models
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [categoryModels, setCategoryModels] = useState<Record<string, Model[]>>({});
    const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());

    // Edit category states
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");

    // Selection mode for export
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Fetch all categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/admin/inventory/admin-inventory", {
                withCredentials: true
            });
            setCategories(response.data.inventory);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Reset form
    const resetForm = () => {
        setCategoryName("");
        setShowAddForm(false);
    };

    // Add new category
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                "http://localhost:5000/api/admin/inventory/category",
                { name: categoryName },
                { withCredentials: true }
            );
            setSuccess("Category added successfully!");
            resetForm();
            await fetchCategories();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add category");
            setTimeout(() => setError(""), 3000);
        }
    };

    // Toggle category status
    const handleToggleStatus = async (id: string) => {
        try {
            await axios.patch(
                `http://localhost:5000/api/admin/inventory/category/status/${id}`,
                {},
                { withCredentials: true }
            );
            setSuccess("Category status updated!");
            await fetchCategories();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to toggle status");
            setTimeout(() => setError(""), 3000);
        }
    };

    // Toggle category expansion and fetch models
    const toggleCategoryExpansion = async (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);

        if (expandedCategories.has(categoryId)) {
            newExpanded.delete(categoryId);
            setExpandedCategories(newExpanded);
        } else {
            newExpanded.add(categoryId);
            setExpandedCategories(newExpanded);

            // Fetch models if not already loaded
            if (!categoryModels[categoryId]) {
                setLoadingModels(new Set(loadingModels).add(categoryId));
                try {
                    const response = await axios.get(
                        `http://localhost:5000/api/admin/inventory/category/${categoryId}/models`,
                        { withCredentials: true }
                    );
                    setCategoryModels({
                        ...categoryModels,
                        [categoryId]: response.data.models || []
                    });
                } catch (err: any) {
                    setError(err.response?.data?.message || "Failed to fetch models");
                } finally {
                    const newLoading = new Set(loadingModels);
                    newLoading.delete(categoryId);
                    setLoadingModels(newLoading);
                }
            }
        }
    };

    // Start editing category name
    const startEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    // Update category name
    const handleUpdateCategory = async (categoryId: string) => {
        if (!editingCategoryName.trim()) {
            setError("Category name cannot be empty");
            return;
        }

        try {
            await axios.patch(
                `http://localhost:5000/api/admin/inventory/category/${categoryId}`,
                { name: editingCategoryName },
                { withCredentials: true }
            );
            setSuccess("Category name updated!");
            setEditingCategoryId(null);
            setEditingCategoryName("");

            // Clear models cache for this category to force refresh
            const newCategoryModels = { ...categoryModels };
            delete newCategoryModels[categoryId];
            setCategoryModels(newCategoryModels);

            // Refresh categories list
            await fetchCategories();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update category");
            setTimeout(() => setError(""), 3000);
        }
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingCategoryId(null);
        setEditingCategoryName("");
    };

    // Filter categories based on search
    const filteredCategories = categories.filter((category) =>
        searchName === "" ||
        category.name.toLowerCase().includes(searchName.toLowerCase())
    );

    // Export to Excel
    const exportToExcel = () => {
        const exportData = categories.map((category) => ({
            "Category Name": category.name,
            "Total Models": category.models.length,
            "Active Models": category.models.filter(m => m.isActive).length,
            "Status": category.isActive ? "Active" : "Inactive",
            "Created Date": new Date(category.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

        const columnWidths = [
            { wch: 30 }, // Category Name
            { wch: 15 }, // Total Models
            { wch: 15 }, // Active Models
            { wch: 10 }, // Status
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        const fileName = `Categories_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Export models of selected category
    const exportModelsToExcel = () => {
        if (!selectedCategoryId) {
            setError("Please select a category first");
            setTimeout(() => setError(""), 3000);
            return;
        }

        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
        if (!selectedCategory) {
            setError("Selected category not found");
            setTimeout(() => setError(""), 3000);
            return;
        }

        const exportData: any[] = [];

        selectedCategory.models.forEach((model) => {
            exportData.push({
                "Category Name": selectedCategory.name,
                "Category Status": selectedCategory.isActive ? "Active" : "Inactive",
                "Model Name": model.name,
                "Model Status": model.isActive ? "Active" : "Inactive",
                "Category Created Date": new Date(selectedCategory.createdAt).toLocaleDateString()
            });
        });

        if (exportData.length === 0) {
            setError(`No models found in ${selectedCategory.name}`);
            setTimeout(() => setError(""), 3000);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Models");

        const columnWidths = [
            { wch: 30 }, // Category Name
            { wch: 15 }, // Category Status
            { wch: 35 }, // Model Name
            { wch: 15 }, // Model Status
            { wch: 20 }  // Category Created Date
        ];
        worksheet['!cols'] = columnWidths;

        const fileName = `${selectedCategory.name}_Models_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        setSuccess(`Exported ${exportData.length} models from ${selectedCategory.name}!`);
        setTimeout(() => setSuccess(""), 3000);

        // Reset selection mode
        setSelectionMode(false);
        setSelectedCategoryId(null);
    };

    // Handle selection mode toggle
    const handleSelectionToggle = () => {
        if (selectionMode) {
            // Deselect
            setSelectionMode(false);
            setSelectedCategoryId(null);
        } else {
            // Select
            setSelectionMode(true);
        }
    };

    // Handle category selection
    const handleCategorySelect = (categoryId: string) => {
        if (selectedCategoryId === categoryId) {
            setSelectedCategoryId(null);
        } else {
            setSelectedCategoryId(categoryId);
        }
    };

    // Get button config based on state
    const getExportButtonConfig = () => {
        if (!selectionMode) {
            return {
                label: "Select",
                onClick: handleSelectionToggle,
                className: "bg-blue-600 hover:bg-blue-700"
            };
        } else if (selectedCategoryId) {
            return {
                label: "Export Model Based",
                onClick: exportModelsToExcel,
                className: "bg-green-600 hover:bg-green-700"
            };
        } else {
            return {
                label: "Deselect",
                onClick: handleSelectionToggle,
                className: "bg-red-600 hover:bg-red-700"
            };
        }
    };

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                    Manage <span className="text-[var(--apl-cyan)]">Categories</span>
                </h1>
                <p className="text-slate-400">Organize and manage device categories</p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    {success}
                </div>
            )}

            {/* Search Filter */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
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
                        Add New Category
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={categories.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export categories summary to Excel"
                    >
                        <FileSpreadsheet size={20} />
                        Export Categories
                    </button>
                    <button
                        onClick={getExportButtonConfig().onClick}
                        disabled={categories.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getExportButtonConfig().className}`}
                        title={selectionMode && !selectedCategoryId ? "Select a category or click to deselect" : selectionMode ? "Export models of selected category" : "Select a category to export its models"}
                    >
                        <FileSpreadsheet size={20} />
                        {getExportButtonConfig().label}
                    </button>
                </div>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="mb-8 p-6 bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Add New Category</h2>
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleAddCategory} className="max-w-md">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-slate-400 text-sm">
                                <FolderTree size={16} />
                                Category Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all"
                                placeholder="e.g., Apple, Samsung, Google"
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-3 bg-[var(--apl-cyan)] text-white rounded-xl hover:bg-[var(--apl-cyan)]/80 transition-all"
                            >
                                <Save size={20} />
                                Add Category
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

            {/* Categories Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    {categories.length === 0
                        ? "No categories found. Add your first category!"
                        : "No categories match your search criteria."}
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <p className="text-sm text-slate-400">
                            Showing <span className="text-[var(--apl-cyan)] font-semibold">{filteredCategories.length}</span> of {categories.length} categories
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredCategories.map((category) => {
                            const isExpanded = expandedCategories.has(category.id);
                            const models = categoryModels[category.id] || [];
                            const isLoadingModels = loadingModels.has(category.id);
                            const isEditing = editingCategoryId === category.id;

                            return (
                                <div
                                    key={category.id}
                                    className={`bg-slate-800/30 backdrop-blur-xl border rounded-xl p-4 transition-all relative ${selectedCategoryId === category.id
                                            ? "border-green-500/50 shadow-lg shadow-green-500/20"
                                            : selectionMode
                                                ? "border-blue-500/30 hover:border-blue-500/50 cursor-pointer"
                                                : "border-white/5 hover:border-[var(--apl-cyan)]/20"
                                        }`}
                                    onClick={() => selectionMode && !isEditing && handleCategorySelect(category.id)}
                                >
                                    {/* Checkbox for selection mode */}
                                    {selectionMode && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedCategoryId === category.id
                                                        ? "bg-green-500 border-green-500"
                                                        : "bg-slate-900/60 border-slate-600 hover:border-blue-400"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCategorySelect(category.id);
                                                }}
                                            >
                                                {selectedCategoryId === category.id && (
                                                    <Check size={14} className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--apl-cyan)]/10 flex items-center justify-center flex-shrink-0">
                                                <FolderTree size={16} className="text-[var(--apl-cyan)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editingCategoryName}
                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                        className="w-full px-2 py-1 text-sm rounded bg-slate-900/60 border border-[var(--apl-cyan)]/30 text-white focus:outline-none focus:border-[var(--apl-cyan)]"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleUpdateCategory(category.id);
                                                            if (e.key === 'Escape') cancelEdit();
                                                        }}
                                                    />
                                                ) : (
                                                    <h3 className="text-base font-bold text-white truncate">{category.name}</h3>
                                                )}
                                                <p className="text-[10px] text-slate-500">
                                                    {new Date(category.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleUpdateCategory(category.id)}
                                                    className="p-1 hover:bg-green-500/10 text-green-400 rounded transition-all"
                                                    title="Save"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-all"
                                                    title="Cancel"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : !selectionMode ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditCategory(category);
                                                }}
                                                className="p-1 hover:bg-white/5 rounded transition-all"
                                                title="Edit name"
                                            >
                                                <Edit2 size={14} className="text-slate-400" />
                                            </button>
                                        ) : null}
                                    </div>

                                    {/* Stats - Smaller */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/40 rounded-lg">
                                            <span className="text-xs text-slate-400">Total Models</span>
                                            <span className="text-white font-semibold text-sm">{category.models.length}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${category.isActive
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                                            }`}>
                                            {category.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    {!selectionMode && (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCategoryExpansion(category.id);
                                                }}
                                                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)] hover:bg-[var(--apl-cyan)]/20 rounded-lg transition-all text-xs"
                                            >
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {isExpanded ? "Hide Models" : "View Models"}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStatus(category.id);
                                                }}
                                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs ${category.isActive
                                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                    : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                    }`}
                                            >
                                                <Power size={14} />
                                                {category.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Models Dropdown */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            {isLoadingModels ? (
                                                <p className="text-xs text-slate-400 text-center py-2">Loading models...</p>
                                            ) : models.length === 0 ? (
                                                <p className="text-xs text-slate-400 text-center py-2">No models found</p>
                                            ) : (
                                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                                    {models.map((model) => (
                                                        <div
                                                            key={model.id}
                                                            className="flex items-center justify-between px-2 py-1.5 bg-slate-900/40 rounded text-xs hover:bg-slate-900/60 transition-all"
                                                        >
                                                            <span className="text-white">{model.name}</span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${model.isActive
                                                                ? "bg-green-500/10 text-green-400"
                                                                : "bg-red-500/10 text-red-400"
                                                                }`}>
                                                                {model.isActive ? "Active" : "Inactive"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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

export default ManageCat;