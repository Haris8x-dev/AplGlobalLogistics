import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Package, ChevronDown, X } from "lucide-react";
import axiosInstance from "../../../utils/axiosConfig";
import { toast } from "react-toastify";

interface StockItem {
    modelId: string;
    modelName: string;
    categoryId: string;
    categoryName: string;
    quantity: number;
}

interface Client {
    id: string;
    companyName: string;
    contactName: string;
    address: string;
    email: string;
    phone: string;
    isActive: boolean;
    stockSummary: StockItem[];
}

interface Category {
    id: string;
    name: string;
    models: Model[];
}

interface Model {
    id: string;
    name: string;
    availableQuantity: number;
}

const TransferStock = () => {
    const [view, setView] = useState<"clientList" | "transferForm">("clientList");
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

    // Transfer Form State
    const [categories, setCategories] = useState<Category[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [filteredModels, setFilteredModels] = useState<Model[]>([]);
    const [showModelSuggestions, setShowModelSuggestions] = useState(false);
    const modelInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fromClientId: "",
        toClientId: "",
        categoryId: "",
        modelId: "",
        modelSearch: "",
        quantity: "",
        message: "",
    });

    const [availableQuantity, setAvailableQuantity] = useState<number>(0);

    // Fetch clients with stock on mount
    useEffect(() => {
        fetchClientsWithStock();
    }, []);

    // Extract categories from selected client's stock
    useEffect(() => {
        if (selectedClient) {
            const uniqueCategories = new Map<string, Category>();

            selectedClient.stockSummary.forEach((stock) => {
                if (!uniqueCategories.has(stock.categoryId)) {
                    uniqueCategories.set(stock.categoryId, {
                        id: stock.categoryId,
                        name: stock.categoryName,
                        models: [],
                    });
                }

                const category = uniqueCategories.get(stock.categoryId)!;
                category.models.push({
                    id: stock.modelId,
                    name: stock.modelName,
                    availableQuantity: stock.quantity,
                });
            });

            setCategories(Array.from(uniqueCategories.values()));
        }
    }, [selectedClient]);

    // Filter models when category changes
    useEffect(() => {
        if (formData.categoryId) {
            const selectedCategory = categories.find((cat) => cat.id === formData.categoryId);
            if (selectedCategory) {
                setModels(selectedCategory.models);
                setFilteredModels(selectedCategory.models);
            }
        } else {
            setModels([]);
            setFilteredModels([]);
        }
        // Reset model selection when category changes
        setFormData((prev) => ({ ...prev, modelId: "", modelSearch: "", quantity: "" }));
        setAvailableQuantity(0);
    }, [formData.categoryId, categories]);

    // Filter models based on search input
    useEffect(() => {
        if (formData.modelSearch) {
            const filtered = models.filter((model) =>
                model.name.toLowerCase().includes(formData.modelSearch.toLowerCase())
            );
            setFilteredModels(filtered);
            setShowModelSuggestions(true);
        } else {
            setFilteredModels(models);
            setShowModelSuggestions(false);
        }
    }, [formData.modelSearch, models]);

    const fetchClientsWithStock = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/api/stock/clients-with-stock");
            setClients(response.data.clients || []);
        } catch (error: any) {
            toast.error("Failed to fetch clients");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (client: Client) => {
        if (client.stockSummary.length === 0) {
            toast.warning(`${client.companyName} has no stock to transfer`);
            return;
        }
        setSelectedClient(client);
        setFormData((prev) => ({
            ...prev,
            fromClientId: client.id,
            toClientId: "",
            categoryId: "",
            modelId: "",
            modelSearch: "",
            quantity: "",
            message: "",
        }));
        setView("transferForm");
    };

    const handleBackToList = () => {
        setView("clientList");
        setSelectedClient(null);
        setFormData({
            fromClientId: "",
            toClientId: "",
            categoryId: "",
            modelId: "",
            modelSearch: "",
            quantity: "",
            message: "",
        });
        setCategories([]);
        setModels([]);
        setAvailableQuantity(0);
    };

    const handleModelSelect = (model: Model) => {
        setFormData((prev) => ({
            ...prev,
            modelId: model.id,
            modelSearch: model.name,
        }));
        setAvailableQuantity(model.availableQuantity);
        setShowModelSuggestions(false);
    };

    const handleModelSearchChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            modelSearch: value,
            modelId: "",
        }));
        setAvailableQuantity(0);
    };

    const clearModelSelection = () => {
        setFormData((prev) => ({
            ...prev,
            modelId: "",
            modelSearch: "",
            quantity: "",
        }));
        setAvailableQuantity(0);
        setShowModelSuggestions(false);
        modelInputRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.toClientId || !formData.modelId || !formData.quantity) {
            toast.warning("Please fill all required fields");
            return;
        }

        const quantity = parseInt(formData.quantity);

        if (quantity <= 0) {
            toast.error("Quantity must be greater than 0");
            return;
        }

        if (quantity > availableQuantity) {
            toast.error(`Insufficient stock! Only ${availableQuantity} units available`);
            return;
        }

        try {
            setSubmitting(true);
            const response = await axiosInstance.post(
                "/api/stock/transfer",
                {
                    fromClientId: formData.fromClientId,
                    toClientId: formData.toClientId,
                    modelId: formData.modelId,
                    quantity: quantity,
                    transferType: "TransferOut",
                    message: formData.message || undefined,
                }
            );

            if (response.data.success) {
                toast.success("Stock transferred successfully!");
                // Reset and go back to client list
                handleBackToList();
                // Refresh client list
                fetchClientsWithStock();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to transfer stock");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // Get available clients for "To Client" dropdown (excluding selected client)
    const getAvailableToClients = () => {
        return clients.filter((client) => client.id !== selectedClient?.id);
    };

    // ==================== CLIENT LIST VIEW ====================
    if (view === "clientList") {
        return (
            <div className="p-6 min-h-screen">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Transfer <span className="text-[var(--apl-cyan)]">Stock</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Select a client to transfer stock from</p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[var(--apl-cyan)]/30 border-t-[var(--apl-cyan)] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Clients Table */}
                        {clients.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto text-slate-600 mb-4" size={48} />
                                <p className="text-slate-400">No clients with stock found</p>
                            </div>
                        ) : (
                            <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5">
                                    <p className="text-sm text-slate-400">
                                        Showing <span className="text-[var(--apl-cyan)] font-semibold">{clients.length}</span> clients
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-full">
                                        <thead className="bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Items</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-white/5">
                                            {clients.map((client) => {
                                                const hasStock = client.stockSummary.length > 0;
                                                const isExpanded = expandedClientId === client.id;

                                                return (
                                                    <React.Fragment key={client.id}>
                                                        <tr
                                                            className={`transition-colors ${hasStock ? "hover:bg-white/5" : "opacity-50"}`}
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div>
                                                                    <p className="text-white font-medium">{client.companyName}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-300">{client.contactName}</td>
                                                            <td className="px-6 py-4 text-slate-400 text-sm max-w-xs truncate" title={client.address}>
                                                                {client.address}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                                                                    className="inline-flex items-center gap-2 text-slate-300 hover:text-[var(--apl-cyan)] transition-colors"
                                                                >
                                                                    <span className="text-sm">{client.stockSummary.length} items</span>
                                                                    <ChevronDown
                                                                        size={16}
                                                                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                                                    />
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleClientSelect(client)}
                                                                    disabled={!hasStock}
                                                                    className="px-4 py-2 bg-[var(--apl-cyan)]/15 text-[var(--apl-cyan)] border border-[var(--apl-cyan)]/30 rounded-lg hover:bg-[var(--apl-cyan)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Select
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {isExpanded && (
                                                            <tr className="bg-slate-900/30">
                                                                <td colSpan={5} className="px-6 py-4">
                                                                    {client.stockSummary.length === 0 ? (
                                                                        <p className="text-slate-500 text-sm italic">No stock available</p>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                            {client.stockSummary.map((stock, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex items-center justify-between text-sm bg-slate-900/60 border border-white/5 rounded-lg px-3 py-2"
                                                                                >
                                                                                    <span className="text-slate-300 truncate pr-2">
                                                                                        {stock.modelName}
                                                                                    </span>
                                                                                    <span className="text-[var(--apl-cyan)] font-semibold whitespace-nowrap">
                                                                                        {stock.quantity}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    // ==================== TRANSFER FORM VIEW ====================
    return (
        <div className="p-6 min-h-screen">
            {/* Header with Back Button */}
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 border border-white/5 rounded-lg text-slate-400 hover:text-white hover:border-[var(--apl-cyan)]/50 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Transfer <span className="text-[var(--apl-cyan)]">Stock</span>
                    </h1>
                    <p className="text-slate-400 text-sm">From: {selectedClient?.companyName}</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: From Client (Disabled) and To Client */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* From Client (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                From Client <span className="text-slate-500">(Source)</span>
                            </label>
                            <div className="w-full px-4 py-4 bg-slate-900/70 border border-slate-700/50 rounded-lg text-slate-400 cursor-not-allowed">
                                {selectedClient?.companyName}
                            </div>
                        </div>

                        {/* To Client */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                To Client <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.toClientId}
                                    onChange={(e) => setFormData({ ...formData, toClientId: e.target.value })}
                                    className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[var(--apl-cyan)] transition-colors appearance-none"
                                    required
                                >
                                    <option value="">Choose destination client...</option>
                                    {getAvailableToClients().map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.companyName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    size={20}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Category */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Select Category <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[var(--apl-cyan)] transition-colors appearance-none"
                                required
                            >
                                <option value="">Choose a category...</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Row 3: Model Search - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Search Model <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                ref={modelInputRef}
                                type="text"
                                value={formData.modelSearch}
                                onChange={(e) => handleModelSearchChange(e.target.value)}
                                onFocus={() => setShowModelSuggestions(true)}
                                placeholder={
                                    formData.categoryId ? "Type to search models..." : "Select category first"
                                }
                                disabled={!formData.categoryId}
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors pr-10"
                                autoComplete="off"
                                required
                            />
                            {formData.modelId && (
                                <button
                                    type="button"
                                    onClick={clearModelSelection}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}

                            {/* Suggestions Dropdown */}
                            {showModelSuggestions &&
                                filteredModels.length > 0 &&
                                formData.modelSearch &&
                                !formData.modelId && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {filteredModels.map((model) => (
                                            <button
                                                key={model.id}
                                                type="button"
                                                onClick={() => handleModelSelect(model)}
                                                className="w-full px-4 py-4 text-left hover:bg-slate-800 transition-colors text-slate-300 hover:text-white border-b border-slate-800 last:border-0 flex items-center justify-between"
                                            >
                                                <span>{model.name}</span>
                                                <span className="text-[var(--apl-cyan)] text-sm font-medium">
                                                    {model.availableQuantity} available
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                            {/* No Results Message */}
                            {showModelSuggestions &&
                                filteredModels.length === 0 &&
                                formData.modelSearch &&
                                formData.categoryId && (
                                    <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 text-center text-slate-400 text-sm">
                                        No models found matching "{formData.modelSearch}"
                                    </div>
                                )}
                        </div>
                        {formData.categoryId && models.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">No models available in this category</p>
                        )}
                    </div>

                    {/* Row 4: Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Quantity <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            placeholder="Enter quantity to transfer"
                            min="1"
                            max={availableQuantity}
                            disabled={!formData.modelId}
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                            required
                        />
                        {formData.modelId && (
                            <p className="text-xs text-[var(--apl-cyan)] mt-1">
                                Available: {availableQuantity} units
                            </p>
                        )}
                    </div>

                    {/* Row 5: Message - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Transfer Note (Optional)
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Add transfer details or reason..."
                            rows={3}
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--apl-cyan)] text-white rounded-lg hover:bg-[var(--apl-cyan)]/80 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Transferring...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Transfer Stock
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferStock;
