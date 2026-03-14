import { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown, X } from "lucide-react";
import axiosInstance from "../../../utils/axiosConfig";
import { toast } from "react-toastify";

interface Client {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    models: Model[];
}

interface Model {
    id: string;
    name: string;
    isActive: boolean;
}

const AddStock = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [filteredModels, setFilteredModels] = useState<Model[]>([]);

    const [formData, setFormData] = useState({
        clientId: "",
        categoryId: "",
        modelId: "",
        modelSearch: "",
        quantity: "",
        transferType: "IMPORT",
        message: "",
        jobNo: "",
        awb: "",
        movementDate: "",
    });

    const [showModelSuggestions, setShowModelSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const modelInputRef = useRef<HTMLInputElement>(null);

    // Fetch clients and categories on mount
    useEffect(() => {
        fetchClients();
        fetchCategories();
    }, []);

    // Filter models when category changes
    useEffect(() => {
        if (formData.categoryId) {
            const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
            if (selectedCategory) {
                const activeModels = selectedCategory.models.filter(model => model.isActive);
                setModels(activeModels);
                setFilteredModels(activeModels);
            }
        } else {
            setModels([]);
            setFilteredModels([]);
        }
        // Reset model selection when category changes
        setFormData(prev => ({ ...prev, modelId: "", modelSearch: "" }));
    }, [formData.categoryId, categories]);

    // Filter models based on search input
    useEffect(() => {
        if (formData.modelSearch) {
            const filtered = models.filter(model =>
                model.name.toLowerCase().includes(formData.modelSearch.toLowerCase())
            );
            setFilteredModels(filtered);
            setShowModelSuggestions(true);
        } else {
            setFilteredModels(models);
            setShowModelSuggestions(false);
        }
    }, [formData.modelSearch, models]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/api/admin/clients/all");
            const allClients = response.data.clients || [];
            // Filter only active clients
            const activeClients = allClients.filter((client: Client) => client.isActive === true);
            setClients(activeClients);
        } catch (error) {
            toast.error("Failed to fetch clients");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/api/admin/inventory/active-inventory");
            setCategories(response.data.inventory || []);
        } catch (error) {
            toast.error("Failed to fetch categories");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleModelSelect = (model: Model) => {
        setFormData(prev => ({
            ...prev,
            modelId: model.id,
            modelSearch: model.name,
        }));
        setShowModelSuggestions(false);
    };

    const handleModelSearchChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            modelSearch: value,
            modelId: "", // Clear selection when typing
        }));
    };

    const clearModelSelection = () => {
        setFormData(prev => ({
            ...prev,
            modelId: "",
            modelSearch: "",
        }));
        setShowModelSuggestions(false);
        modelInputRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientId || !formData.modelId || !formData.quantity || !formData.jobNo || !formData.awb || !formData.movementDate) {
            toast.warning("Please fill all required fields");
            return;
        }

        try {
            setSubmitting(true);
            const response = await axiosInstance.post(
                "/api/stock/add-initial",
                {
                    clientId: formData.clientId,
                    modelId: formData.modelId,
                    quantity: parseInt(formData.quantity),
                    transferType: formData.transferType,
                    message: formData.message || undefined,
                    jobNo: formData.jobNo,
                    awb: formData.awb,
                    movementDate: formData.movementDate,
                }
            );

            if (response.data.success) {
                toast.success("Stock added successfully!");
                // Reset form
                setFormData({
                    clientId: "",
                    categoryId: "",
                    modelId: "",
                    modelSearch: "",
                    quantity: "",
                    transferType: "IMPORT",
                    message: "",
                    jobNo: "",
                    awb: "",
                    movementDate: "",
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to add stock");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">
                    Add <span className="text-(--apl-cyan)">Stock</span>
                </h1>
                <p className="text-slate-400 text-sm">Initialize stock for a client</p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: Client and Category */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Client Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Client <span className="text-green-400">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan) transition-colors appearance-none"
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Choose a client...</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.companyName}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Category Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Category <span className="text-green-400">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan) transition-colors appearance-none"
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Choose a category...</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Model Search - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Search Model <span className="text-green-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                ref={modelInputRef}
                                type="text"
                                value={formData.modelSearch}
                                onChange={(e) => handleModelSearchChange(e.target.value)}
                                onFocus={() => setShowModelSuggestions(true)}
                                placeholder={formData.categoryId ? "Type to search models..." : "Select category first"}
                                disabled={!formData.categoryId || loading}
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan) transition-colors pr-10"
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
                            {showModelSuggestions && filteredModels.length > 0 && formData.modelSearch && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                    {filteredModels.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => handleModelSelect(model)}
                                            className="w-full px-4 py-4 text-left hover:bg-slate-800 transition-colors text-slate-300 hover:text-white border-b border-slate-800 last:border-0"
                                        >
                                            {model.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No Results Message */}
                            {showModelSuggestions && filteredModels.length === 0 && formData.modelSearch && formData.categoryId && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 text-center text-slate-400 text-sm">
                                    No models found matching "{formData.modelSearch}"
                                </div>
                            )}
                        </div>
                        {formData.categoryId && models.length === 0 && (
                            <p className="text-xs text-slate-500 mt-1">No active models in this category</p>
                        )}
                    </div>

                    {/* Row 3: Quantity and Transfer Type */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Quantity <span className="text-green-400">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="Enter quantity"
                                min="1"
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan) transition-colors"
                                required
                            />
                        </div>

                        {/* Transfer Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Transfer Type <span className="text-green-400">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.transferType}
                                    onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
                                    className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan) transition-colors appearance-none"
                                    required
                                >
                                    <option value="IMPORT">Import</option>
                                    <option value="TRANSFER-IN">Transfer-In</option>
                                    <option value="TRANSFER-OUT">Transfer-Out</option>
                                    <option value="LOCAL">Local</option>
                                    <option value="EXPORT">Export</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Message - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Add a note or description..."
                            rows={3}
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan) transition-colors resize-none"
                        />
                    </div>

                    {/* Row 5: Job No, AWB, and Date */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Job No */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Job No <span className="text-green-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.jobNo}
                                onChange={(e) => setFormData({ ...formData, jobNo: e.target.value })}
                                placeholder="e.g., JOB-12345"
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan) transition-colors"
                                required
                            />
                        </div>

                        {/* AWB */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                AWB <span className="text-green-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.awb}
                                onChange={(e) => setFormData({ ...formData, awb: e.target.value })}
                                placeholder="Air Waybill Number"
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan) transition-colors"
                                required
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Movement Date <span className="text-green-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.movementDate}
                                onChange={(e) => setFormData({ ...formData, movementDate: e.target.value })}
                                className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan) transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || loading}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Adding Stock...
                                </>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    Add Stock
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStock;
