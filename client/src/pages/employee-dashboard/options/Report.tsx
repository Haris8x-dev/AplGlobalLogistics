import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import { ArrowLeft, Search, Download, Package, TrendingUp, TrendingDown, FileSpreadsheet, Eye, RefreshCw, MessageSquare, X, Undo2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

interface Client {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phoneNumber: string;
    address: string;
    industry: string;
    isActive: boolean;
    totalStockUnits?: number;
    _count?: {
        clientStocks: number;
    };
}

interface ClientStock {
    id: string;
    currentBalance: number;
    modelId: string;
    model: {
        id: string;
        name: string;
        category: {
            name: string;
        };
    };
}

interface StockHistory {
    id: string;
    quantity: number;
    transferType: string;
    message: string | null;
    jobNo?: string | null;
    awb?: string | null;
    movementDate?: string | null;
    fromClientId?: string | null;
    toClientId?: string | null;
    fromClient?: { companyName: string } | null;
    toClient?: { companyName: string } | null;
    createdAt: string;
    transferGroupId?: string | null;
    user: {
        fullName: string;
    };
    model: {
        name: string;
    };
}

const LoadingOverlay = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="text-center">
                    <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm">{subtitle}</p>
                </div>
            </div>
        </div>
    </div>
);

const LoadingPanel = ({ message, showSpinner }: { message: string; showSpinner: boolean }) => (
    <div className="py-14 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            {showSpinner ? (
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-700 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
            ) : (
                <div className="w-12 h-12" />
            )}
            <p className="text-slate-400 text-sm">{message}</p>
        </div>
    </div>
);

const LOADER_SHOW_DELAY_MS = 250;
const LOADER_MIN_VISIBLE_MS = 250;

const Report = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientStocks, setClientStocks] = useState<ClientStock[]>([]);
    const [selectedModel, setSelectedModel] = useState<ClientStock | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [searchClients, setSearchClients] = useState("");
    const [searchModels, setSearchModels] = useState("");
    const [activeCategoryTab, setActiveCategoryTab] = useState<string>("ALL");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
    const [showRefreshingIndicator, setShowRefreshingIndicator] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [revertReason, setRevertReason] = useState("");
    const [recordToRevert, setRecordToRevert] = useState<StockHistory | null>(null);
    const [revertingGroupId, setRevertingGroupId] = useState<string | null>(null);
    const loadingVisibleAtRef = useRef<number | null>(null);
    const refreshingVisibleAtRef = useRef<number | null>(null);

    useEffect(() => {
        let showTimer: ReturnType<typeof setTimeout> | undefined;
        let hideTimer: ReturnType<typeof setTimeout> | undefined;

        if (loading) {
            showTimer = setTimeout(() => {
                loadingVisibleAtRef.current = Date.now();
                setShowLoadingIndicator(true);
            }, LOADER_SHOW_DELAY_MS);
        } else if (showLoadingIndicator) {
            const elapsed = loadingVisibleAtRef.current
                ? Date.now() - loadingVisibleAtRef.current
                : 0;
            const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);

            hideTimer = setTimeout(() => {
                setShowLoadingIndicator(false);
                loadingVisibleAtRef.current = null;
            }, remaining);
        } else {
            loadingVisibleAtRef.current = null;
        }

        return () => {
            if (showTimer) clearTimeout(showTimer);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [loading, showLoadingIndicator]);

    useEffect(() => {
        let showTimer: ReturnType<typeof setTimeout> | undefined;
        let hideTimer: ReturnType<typeof setTimeout> | undefined;

        if (refreshing) {
            showTimer = setTimeout(() => {
                refreshingVisibleAtRef.current = Date.now();
                setShowRefreshingIndicator(true);
            }, LOADER_SHOW_DELAY_MS);
        } else if (showRefreshingIndicator) {
            const elapsed = refreshingVisibleAtRef.current
                ? Date.now() - refreshingVisibleAtRef.current
                : 0;
            const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);

            hideTimer = setTimeout(() => {
                setShowRefreshingIndicator(false);
                refreshingVisibleAtRef.current = null;
            }, remaining);
        } else {
            refreshingVisibleAtRef.current = null;
        }

        return () => {
            if (showTimer) clearTimeout(showTimer);
            if (hideTimer) clearTimeout(hideTimer);
        };
    }, [refreshing, showRefreshingIndicator]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await axiosInstance.get("/api/admin/clients/all");
            setClients(response.data.clients || []);
        } catch (error) {
            toast.error("Failed to fetch clients");
            console.error(error);
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const fetchClientStocks = async (clientId: string) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/stock/client-inventory/${clientId}`);
            setClientStocks(response.data.inventory || []);
        } catch (error) {
            toast.error("Failed to fetch client inventory");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (clientId: string, modelId: string) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(
                `/api/stock/history/${clientId}/${modelId}`
            );
            setHistory(response.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch history");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        fetchClientStocks(client.id);
        setSelectedModel(null);
        setHistory([]);
        setSearchModels("");
        setActiveCategoryTab("ALL");
    };

    const handleModelClick = (stock: ClientStock) => {
        setSelectedModel(stock);
        if (selectedClient) {
            fetchHistory(selectedClient.id, stock.modelId);
        }
    };

    const handleBack = () => {
        if (selectedModel) {
            setSelectedModel(null);
            setHistory([]);
        } else if (selectedClient) {
            setSelectedClient(null);
            setClientStocks([]);
        }
    };

    // const handleRevertClick = (record: StockHistory) => {
    //     if (!record.transferGroupId) {
    //         toast.error("Cannot revert: missing transfer group ID");
    //         return;
    //     }
    //     setRecordToRevert(record);
    //     setRevertReason("");
    //     setShowRevertModal(true);
    // };

    const handleConfirmRevert = async () => {
        if (!recordToRevert || !recordToRevert.transferGroupId) {
            toast.error("Invalid record for reversion");
            return;
        }

        if (!revertReason.trim()) {
            toast.error("Please provide a reason for reversion");
            return;
        }

        try {
            setRevertingGroupId(recordToRevert.transferGroupId);

            // Determine which endpoint to call based on transfer type
            const endpoint = !isAddStockRecord(recordToRevert)
                ? `/api/stock/revert-transfer/${recordToRevert.transferGroupId}`
                : `/api/stock/revert-add-stock/${recordToRevert.transferGroupId}`;

            const response = await axiosInstance.post(endpoint, {
                reason: revertReason.trim()
            });

            if (response.data.success) {
                toast.success("Stock entry reverted successfully");
                // Refresh history and close modal
                setShowRevertModal(false);
                setRecordToRevert(null);
                setRevertReason("");
                if (selectedClient && selectedModel) {
                    await fetchHistory(selectedClient.id, selectedModel.modelId);
                    await fetchClientStocks(selectedClient.id);
                }
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || "Failed to revert stock entry";
            toast.error(errorMsg);
        } finally {
            setRevertingGroupId(null);
        }
    };

    const getStockMovementText = (record: StockHistory) => {
        if (record.quantity > 0) {
            return record.fromClient?.companyName
                ? `Received from client ${record.fromClient.companyName}`
                : "-";
        }

        if (record.quantity < 0) {
            return record.toClient?.companyName
                ? `Transferred to client ${record.toClient.companyName}`
                : "Transferred to client Unknown";
        }

        return "-";
    };

    const isAddStockRecord = (record: StockHistory) => {
        return record.transferType === "INITIAL_LOAD" ||
            record.transferType === "In" ||
            (!record.fromClientId && !record.toClientId && record.quantity > 0);
    };

    const isRevertedOrReversal = (record: StockHistory) => {
        // Check if this is a reversal entry
        if (record.transferType === "REVERSAL") {
            return true;
        }
        // Check if this entry was reverted (a reversal exists with its group ID in the message)
        if (record.transferGroupId) {
            return history.some(h =>
                h.transferType === "REVERSAL" &&
                h.message &&
                h.message.includes(`[REVERSAL_OF_GROUP:${record.transferGroupId}]`)
            );
        }
        return false;
    };

    const exportToExcel = () => {
        if (history.length === 0) {
            toast.warning("No data to export");
            return;
        }

        const totalCurrentQuantity = selectedModel?.currentBalance ?? 0;

        // Filter out REVERSAL entries and their originals from export
        const data = history
            .filter((record) => !isRevertedOrReversal(record))
            .map((record) => ({
                "Date": new Date(record.createdAt).toLocaleString(),
                "Movement Date": record.movementDate ? new Date(record.movementDate).toLocaleDateString() : "-",
                "Type": record.transferType || "TRANSFER",
                "Stock Movement": getStockMovementText(record),
                "Model": record.model.name,
                "Quantity": record.quantity,
                "Job No": record.jobNo || "-",
                "AWB": record.awb || "-",
                "Message": record.message || "-",
                "Performed By": record.user.fullName,
            }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [
                [],
                ["Total Current Quantity", totalCurrentQuantity]
            ],
            { origin: -1 }
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "History");

        XLSX.writeFile(workbook, `${selectedClient?.companyName}_${selectedModel?.model.name}_history.xlsx`);
        toast.success("Report exported successfully");
    };

    const exportClientsToExcel = () => {
        if (filteredClients.length === 0) {
            toast.warning("No clients to export");
            return;
        }

        const data = filteredClients.map((client) => ({
            "Company Name": client.companyName,
            "Contact Name": client.contactName,
            "Email": client.email,
            "Phone Number": client.phoneNumber,
            "Address": client.address || "N/A",
            "Industry": client.industry || "N/A",
            "Total Models": client._count?.clientStocks || 0,
            "Total Stock Units": client.totalStockUnits || 0,
            "Status": client.isActive ? "Active" : "Inactive",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        const fileName = `Client_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast.success("Clients exported successfully");
    };

    const filteredClients = clients.filter((client) =>
        client.companyName.toLowerCase().includes(searchClients.toLowerCase()) ||
        client.contactName.toLowerCase().includes(searchClients.toLowerCase()) ||
        client.email.toLowerCase().includes(searchClients.toLowerCase())
    );

    const filteredStocks = clientStocks.filter((stock) =>
        (activeCategoryTab === "ALL" || stock.model.category.name === activeCategoryTab) &&
        stock.model.name.toLowerCase().includes(searchModels.toLowerCase())
    );

    const categoryTabs = Array.from(
        new Set(clientStocks.map((stock) => stock.model.category.name || "Uncategorized"))
    ).sort((a, b) => a.localeCompare(b));

    const categorySummaries = categoryTabs.map((category) => {
        const categoryStocks = clientStocks.filter(
            (stock) => (stock.model.category.name || "Uncategorized") === category
        );

        return {
            category,
            modelCount: categoryStocks.length,
            totalStock: categoryStocks.reduce((sum, stock) => sum + stock.currentBalance, 0)
        };
    });

    const filteredTotalStock = filteredStocks.reduce(
        (sum, stock) => sum + stock.currentBalance,
        0
    );

    const allCategorySummary = {
        modelCount: clientStocks.length,
        totalStock: clientStocks.reduce((sum, stock) => sum + stock.currentBalance, 0)
    };

    const exportModelInventoryToExcel = () => {
        if (filteredStocks.length === 0) {
            toast.warning("No models to export");
            return;
        }

        const data = filteredStocks.map((stock) => ({
            "Category": stock.model.category.name,
            "Model": stock.model.name,
            "Current Stock": stock.currentBalance,
        }));

        const summaryData = activeCategoryTab === "ALL"
            ? categorySummaries.map((summary) => ({
                "Category": summary.category,
                "Total Models": summary.modelCount,
                "Total Current Stock": summary.totalStock,
            }))
            : [{
                "Category": activeCategoryTab,
                "Total Models": filteredStocks.length,
                "Total Current Stock": filteredTotalStock,
            }];

        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.sheet_add_aoa(
            worksheet,
            [
                [],
                ["Category Total Stock Units", "", filteredTotalStock]
            ],
            { origin: -1 }
        );

        const totalRowIndex = data.length + 3;
        if (worksheet[`A${totalRowIndex}`]) {
            worksheet[`A${totalRowIndex}`].s = { font: { bold: true } };
        }
        if (worksheet[`C${totalRowIndex}`]) {
            worksheet[`C${totalRowIndex}`].s = { font: { bold: true } };
        }

        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Client Inventory");
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Category Summary");

        const categorySuffix = activeCategoryTab === "ALL" ? "ALL" : activeCategoryTab;
        const fileName = `${selectedClient?.companyName || "Client"}_Inventory_${categorySuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast.success("Inventory exported successfully");
    };

    // View 1: Clients Table
    if (!selectedClient) {
        return (
            <div className="p-6 min-h-screen relative">
                {showRefreshingIndicator && (
                    <LoadingOverlay
                        title="Refreshing Reports"
                        subtitle="Fetching latest data..."
                    />
                )}

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Client <span className="text-(--apl-cyan)">Reports</span>
                        </h1>
                        <p className="text-slate-400 text-sm">Select a client to view detailed inventory reports</p>
                    </div>
                    <button
                        onClick={() => fetchClients(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-(--apl-cyan) text-white rounded-xl hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 font-medium"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Search and Export */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by company name, contact, email..."
                            value={searchClients}
                            onChange={(e) => setSearchClients(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan)"
                        />
                    </div>
                    <button
                        onClick={exportClientsToExcel}
                        disabled={filteredClients.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheet size={18} />
                        Export Excel
                    </button>
                </div>

                {loading ? (
                    <LoadingPanel message="Loading clients..." showSpinner={showLoadingIndicator} />
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        {clients.length === 0 ? "No clients found" : "No clients match your search"}
                    </div>
                ) : (
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5">
                            <p className="text-sm text-slate-400">
                                Showing <span className="text-(--apl-cyan) font-semibold">{filteredClients.length}</span> of {clients.length} clients
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Industry</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Models</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stock</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{client.companyName}</div>
                                                {client.address && <div className="text-xs text-slate-400 mt-1">{client.address}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">{client.contactName}</td>
                                            <td className="px-6 py-4 text-slate-300">{client.email}</td>
                                            <td className="px-6 py-4 text-slate-300">{client.phoneNumber}</td>
                                            <td className="px-6 py-4 text-slate-300">{client.industry || "—"}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 bg-(--apl-cyan)/10 text-(--apl-cyan) rounded-full text-sm font-semibold">
                                                    {client._count?.clientStocks || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-semibold">
                                                    {client.totalStockUnits || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleClientClick(client)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all"
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // View 2: Models List
    if (selectedClient && !selectedModel) {
        return (
            <div className="p-6 min-h-screen relative">
                {showRefreshingIndicator && (
                    <LoadingOverlay
                        title="Refreshing Inventory"
                        subtitle="Fetching latest data..."
                    />
                )}

                {loading && !refreshing && showLoadingIndicator && (
                    <LoadingOverlay
                        title="Loading Inventory"
                        subtitle="Preparing client stock data..."
                    />
                )}

                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Clients
                </button>

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            {selectedClient.companyName} <span className="text-(--apl-cyan)">Inventory</span>
                        </h1>
                        <p className="text-slate-400 text-sm">Select a model to view transaction history</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportModelInventoryToExcel}
                            disabled={filteredStocks.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileSpreadsheet size={18} />
                            Export Excel
                        </button>
                        <button
                            onClick={() => {
                                setRefreshing(true);
                                fetchClientStocks(selectedClient.id).finally(() => setRefreshing(false));
                            }}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-(--apl-cyan) text-white rounded-xl hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 font-medium"
                        >
                            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setActiveCategoryTab("ALL")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategoryTab === "ALL"
                                ? "bg-(--apl-cyan) text-white"
                                : "bg-slate-900/50 text-slate-400 hover:bg-slate-800/60"
                                }`}
                        >
                            All ({allCategorySummary.modelCount} / {allCategorySummary.totalStock})
                        </button>
                        {categorySummaries.map((summary) => {
                            return (
                                <button
                                    key={summary.category}
                                    onClick={() => setActiveCategoryTab(summary.category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategoryTab === summary.category
                                        ? "bg-(--apl-cyan) text-white"
                                        : "bg-slate-900/50 text-slate-400 hover:bg-slate-800/60"
                                        }`}
                                >
                                    {summary.category} ({summary.modelCount} / {summary.totalStock})
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchModels}
                                onChange={(e) => setSearchModels(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan)"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <LoadingPanel message="Loading inventory..." showSpinner={showLoadingIndicator} />
                    ) : filteredStocks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No inventory found for this client</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-slate-900/50 border border-white/5 px-4 py-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-slate-400">Current Filter</p>
                                    <p className="text-sm font-semibold text-white">
                                        {activeCategoryTab === "ALL" ? "All Categories" : activeCategoryTab}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-wider text-slate-400">Total Stock Units</p>
                                    <p className="text-lg font-bold text-(--apl-cyan)">{filteredTotalStock}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Stock</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredStocks.map((stock) => (
                                            <tr key={stock.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-slate-300">{stock.model.category.name}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="text-purple-400" size={16} />
                                                        <span className="text-white font-medium">{stock.model.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 bg-(--apl-cyan)/10 text-(--apl-cyan) rounded-full text-sm font-semibold">
                                                        {stock.currentBalance}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleModelClick(stock)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all"
                                                    >
                                                        <Eye size={15} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // View 3: History Details
    return (
        <div className="p-6 min-h-screen relative">
            {showRefreshingIndicator && (
                <LoadingOverlay
                    title="Refreshing History"
                    subtitle="Fetching latest data..."
                />
            )}

            {loading && !refreshing && showLoadingIndicator && (
                <LoadingOverlay
                    title="Loading History"
                    subtitle="Preparing transaction records..."
                />
            )}

            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to Models
            </button>

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Transaction <span className="text-(--apl-cyan)">History</span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {selectedClient?.companyName} - {selectedModel?.model.name}
                    </p>
                    <div className="mt-4 max-w-xs rounded-xl border border-(--apl-cyan)/40 bg-linear-to-r from-(--apl-cyan)/20 to-slate-900/80 px-4 py-3 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-200/90">Total Current Quantity</span>
                            <span className="text-2xl font-bold leading-none text-(--apl-cyan)">{selectedModel?.currentBalance ?? 0}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (selectedClient && selectedModel) {
                                setRefreshing(true);
                                fetchHistory(selectedClient.id, selectedModel.modelId).finally(() => setRefreshing(false));
                            }
                        }}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-(--apl-cyan) text-white rounded-xl hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 font-medium"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all"
                    >
                        <Download size={18} />
                        Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                {loading ? (
                    <LoadingPanel message="Loading history..." showSpinner={showLoadingIndicator} />
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No transactions found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Entry Date & Time</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Movement Date</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Stock Movement</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Model</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Quantity</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Job No</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">AWB</th>
                                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Message</th>
                                    {/* <th className="text-center py-3 px-4 text-slate-400 font-medium">Action</th> */}
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Performed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr
                                        key={record.id}
                                        className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${isRevertedOrReversal(record) ? "bg-red-500/10" : ""
                                            }`}
                                    >
                                        <td className="py-3 px-4 text-slate-300">
                                            {new Date(record.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 text-xs">
                                            {record.movementDate ? new Date(record.movementDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${isRevertedOrReversal(record)
                                                    ? "bg-red-500/20 text-red-400"
                                                    : record.transferType === "INITIAL_LOAD"
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : "bg-purple-500/10 text-purple-400"
                                                    }`}
                                            >
                                                {record.transferType || "TRANSFER"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 text-xs">
                                            {getStockMovementText(record)}
                                        </td>
                                        <td className="py-3 px-4 text-white">{record.model.name}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {record.quantity > 0 ? (
                                                    <TrendingUp className="text-green-400" size={16} />
                                                ) : (
                                                    <TrendingDown className="text-red-400" size={16} />
                                                )}
                                                <span
                                                    className={`font-semibold ${record.quantity > 0 ? "text-green-400" : "text-red-400"
                                                        }`}
                                                >
                                                    {record.quantity > 0 ? "+" : ""}
                                                    {record.quantity}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-300 text-xs">{record.jobNo || "-"}</td>
                                        <td className="py-3 px-4 text-slate-300 text-xs">{record.awb || "-"}</td>
                                        <td className="py-3 px-4 text-center">
                                            {record.message ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedMessage(record.message);
                                                        setShowMessageModal(true);
                                                    }}
                                                    className="inline-flex items-center justify-center p-1.5 rounded-lg bg-(--apl-cyan)/10 text-(--apl-cyan) hover:bg-(--apl-cyan)/20 transition-all"
                                                    title="View message"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            ) : (
                                                <span className="text-slate-500 text-xs">-</span>
                                            )}
                                        </td>
                                        {/* <td className="py-3 px-4 text-center">
                                            {record.transferType !== "REVERSAL" && record.transferGroupId ? (
                                                isAddStockRecord(record) ? (
                                                    <button
                                                        onClick={() => handleRevertClick(record)}
                                                        disabled={revertingGroupId === record.transferGroupId}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                                        title="Delete Initial Stock"
                                                    >
                                                        <Trash2 size={16} />
                                                        {revertingGroupId === record.transferGroupId ? "Deleting..." : "Delete"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRevertClick(record)}
                                                        disabled={revertingGroupId === record.transferGroupId}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                                    >
                                                        <Undo2 size={16} />
                                                        {revertingGroupId === record.transferGroupId ? "Reverting..." : "Revert"}
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-slate-500 text-xs">-</span>
                                            )}
                                        </td> */}
                                        <td className="py-3 px-4 text-slate-300">{record.user.fullName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showMessageModal && selectedMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800/95 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <MessageSquare size={20} className="text-(--apl-cyan)" />
                                Message
                            </h3>
                            <button
                                onClick={() => {
                                    setShowMessageModal(false);
                                    setSelectedMessage(null);
                                }}
                                className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage}</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowMessageModal(false);
                                setSelectedMessage(null);
                            }}
                            className="w-full mt-4 px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showRevertModal && recordToRevert && (() => {
                const isDeleting = isAddStockRecord(recordToRevert);
                return (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-800/95 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    {isDeleting ? <Trash2 size={20} className="text-yellow-500" /> : <Undo2 size={20} className="text-red-400" />}
                                    {isDeleting ? "Delete Stock Entry" : "Revert Stock Entry"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowRevertModal(false);
                                        setRecordToRevert(null);
                                        setRevertReason("");
                                    }}
                                    disabled={revertingGroupId !== null}
                                    className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className={isDeleting ? "bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4" : "bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4"}>
                                <p className={isDeleting ? "text-yellow-300 text-sm" : "text-red-300 text-sm"}>
                                    <strong>Warning:</strong> {isDeleting ? "This action will permanently delete the stock entry from the history. Make sure no transfers have used this stock." : "This action will create a reversal entry. The original entry and its reversal will remain in the history for audit purposes."}
                                </p>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Entry Details</label>
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <p><strong>Type:</strong> {recordToRevert.transferType}</p>
                                        <p><strong>Quantity:</strong> {recordToRevert.quantity > 0 ? '+' : ''}{recordToRevert.quantity}</p>
                                        <p><strong>Date:</strong> {new Date(recordToRevert.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Reason for {isDeleting ? "Deletion" : "Reversal"}</label>
                                    <textarea
                                        value={revertReason}
                                        onChange={(e) => setRevertReason(e.target.value)}
                                        placeholder={`Enter reason for ${isDeleting ? "deleting" : "reverting"} this entry...`}
                                        rows={3}
                                        disabled={revertingGroupId !== null}
                                        className={`w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 disabled:opacity-50 text-sm ${isDeleting ? "focus:border-yellow-500 focus:ring-yellow-500/50" : "focus:border-red-400 focus:ring-red-400/50"}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRevertModal(false);
                                        setRecordToRevert(null);
                                        setRevertReason("");
                                    }}
                                    disabled={revertingGroupId !== null}
                                    className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRevert}
                                    disabled={!revertReason.trim() || revertingGroupId !== null}
                                    className={`flex-1 px-4 py-2 ${isDeleting ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"} text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                                >
                                    {revertingGroupId ? (isDeleting ? "Deleting..." : "Reverting...") : (isDeleting ? "Confirm Delete" : "Confirm Revert")}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Report;
