import { useState, useEffect, useMemo, useRef } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import { ArrowLeft, Search, Download, Package, TrendingUp, TrendingDown, FileSpreadsheet, Eye, RefreshCw, MessageSquare, X, CheckCircle, Edit, Ban } from "lucide-react";
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
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    user: {
        fullName: string;
    };
    model: {
        name: string;
    };
}

type HistoryStatusFilter = "ALL" | "PENDING" | "COMPLETED" | "CANCELLED";

interface HistoryPagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

const buildRevertedGroupIds = (records: StockHistory[]) => {
    const ids = new Set<string>();

    records.forEach((record) => {
        if (record.transferType === "REVERSAL" && record.message) {
            const match = record.message.match(/\[REVERSAL_OF_GROUP:([^\]]+)\]/);
            if (match?.[1]) {
                ids.add(match[1]);
            }
        }
    });

    return ids;
};

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
    const [exporting, setExporting] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize] = useState(50);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>("ALL");
    const [historyFromDate, setHistoryFromDate] = useState("");
    const [historyToDate, setHistoryToDate] = useState("");

    // Pending Transfer states
    const [actioningGroupId, setActioningGroupId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<StockHistory | null>(null);
    const [editFormData, setEditFormData] = useState({ quantity: "", awb: "", jobNo: "" });
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

    const fetchClients = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await axiosInstance.get("/api/admin/clients/all");
            const clientsData = response.data.clients || [];
            setClients(clientsData);
            return clientsData;
        } catch (error) {
            toast.error("Failed to fetch clients");
            console.error(error);
            return [];
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            const allClients = await fetchClients();
            const pendingActionStr = sessionStorage.getItem("pendingReportAction");

            if (pendingActionStr && allClients && allClients.length > 0) {
                const { clientId, modelId } = JSON.parse(pendingActionStr);
                sessionStorage.removeItem("pendingReportAction");

                const clientTarget = allClients.find((c: Client) => c.id === clientId);
                if (clientTarget) {
                    setSelectedClient(clientTarget);
                    try {
                        setLoading(true);
                        const stockResponse = await axiosInstance.get(`/api/stock/client-inventory/${clientId}`);
                        const stocks = stockResponse.data.inventory || [];
                        setClientStocks(stocks);

                        const stockTarget = stocks.find((s: ClientStock) => s.modelId === modelId);
                        if (stockTarget) {
                            setSelectedModel(stockTarget);
                            await fetchHistory(clientId, modelId, { page: 1 });
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };
        init();
    }, []);

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

    const fetchHistory = async (
        clientId: string,
        modelId: string,
        options: { page?: number; fromDate?: string; toDate?: string; status?: HistoryStatusFilter } = {}
    ) => {
        const pageToLoad = options.page ?? historyPage;
        const fromDateValue = options.fromDate ?? historyFromDate;
        const toDateValue = options.toDate ?? historyToDate;
        const statusValue = options.status ?? historyStatusFilter;

        try {
            setLoading(true);
            const params: Record<string, string | number> = {
                page: pageToLoad,
                pageSize: historyPageSize,
                timezoneOffsetMinutes: new Date().getTimezoneOffset(),
            };

            if (fromDateValue) {
                params.fromDate = fromDateValue;
            }

            if (toDateValue) {
                params.toDate = toDateValue;
            }

            if (statusValue !== "ALL") {
                params.status = statusValue;
            }

            const response = await axiosInstance.get(`/api/stock/history/${clientId}/${modelId}`, {
                params,
            });

            const historyData: StockHistory[] = response.data.data || [];
            const pagination: HistoryPagination = {
                page: response.data.pagination?.page ?? pageToLoad,
                pageSize: response.data.pagination?.pageSize ?? historyPageSize,
                totalCount: response.data.pagination?.totalCount ?? historyData.length,
                totalPages: response.data.pagination?.totalPages ?? 0,
            };

            setHistory(historyData);
            setHistoryPage(pagination.page);
            setHistoryTotalPages(pagination.totalPages);
            setHistoryTotalCount(pagination.totalCount);
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
        setHistoryPage(1);
        setHistoryTotalPages(0);
        setHistoryTotalCount(0);
        setHistoryStatusFilter("ALL");
        setHistoryFromDate("");
        setHistoryToDate("");
        setSearchModels("");
        setActiveCategoryTab("ALL");
    };

    const handleModelClick = (stock: ClientStock) => {
        setSelectedModel(stock);
        setHistoryPage(1);
        setHistoryTotalPages(0);
        setHistoryTotalCount(0);
        if (selectedClient) {
            fetchHistory(selectedClient.id, stock.modelId, { page: 1 });
        }
    };

    const handleBack = () => {
        if (selectedModel) {
            setSelectedModel(null);
            setHistory([]);
            setHistoryPage(1);
            setHistoryTotalPages(0);
            setHistoryTotalCount(0);
            setHistoryStatusFilter("ALL");
            setHistoryFromDate("");
            setHistoryToDate("");
        } else if (selectedClient) {
            setSelectedClient(null);
            setClientStocks([]);
        }
    };

    const handleProceedTransfer = async (transferGroupId: string) => {
        try {
            setActioningGroupId(transferGroupId);
            const response = await axiosInstance.post(`/api/stock/proceed-transfer/${transferGroupId}`);
            if (response.data.success) {
                toast.success("Transfer completed successfully");
                if (selectedClient && selectedModel) {
                    await fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage });
                    await fetchClientStocks(selectedClient.id);
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to proceed transfer");
        } finally {
            setActioningGroupId(null);
        }
    };

    const handleCancelTransfer = async (transferGroupId: string) => {
        try {
            setActioningGroupId(transferGroupId);
            const response = await axiosInstance.post(`/api/stock/cancel-transfer/${transferGroupId}`);
            if (response.data.success) {
                toast.success("Transfer cancelled successfully");
                if (selectedClient && selectedModel) {
                    await fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage });
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to cancel transfer");
        } finally {
            setActioningGroupId(null);
        }
    };

    const handleEditClick = (record: StockHistory) => {
        setRecordToEdit(record);
        setEditFormData({
            quantity: Math.abs(record.quantity).toString(),
            awb: record.awb || "",
            jobNo: record.jobNo || ""
        });
        setShowEditModal(true);
    };

    const handleConfirmEdit = async () => {
        if (!recordToEdit || !recordToEdit.transferGroupId) return;

        try {
            setActioningGroupId(recordToEdit.transferGroupId);
            const response = await axiosInstance.put(`/api/stock/edit-transfer/${recordToEdit.transferGroupId}`, editFormData);
            if (response.data.success) {
                toast.success("Transfer updated successfully");
                setShowEditModal(false);
                setRecordToEdit(null);
                if (selectedClient && selectedModel) {
                    await fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage });
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update transfer");
        } finally {
            setActioningGroupId(null);
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
                : "-";
        }

        return "-";
    };

    const revertedGroupIds = useMemo(() => buildRevertedGroupIds(history), [history]);

    const isRevertedOrReversal = (record: StockHistory) => {
        // Check if this is a reversal entry
        if (record.transferType === "REVERSAL") {
            return true;
        }
        // Check if this entry was reverted (a reversal exists with its group ID in the message)
        if (record.transferGroupId) {
            return revertedGroupIds.has(record.transferGroupId);
        }
        return false;
    };

    const exportToExcel = async () => {
        if (!selectedClient || !selectedModel) {
            toast.warning("Select a client and model first");
            return;
        }

        const totalCurrentQuantity = selectedModel.currentBalance ?? 0;

        try {
            setExporting(true);

            const allHistory: StockHistory[] = [];
            let page = 1;
            let totalPages = 1;

            while (page <= totalPages) {
                const params: Record<string, string | number> = {
                    page,
                    pageSize: 200,
                    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
                };

                if (historyFromDate) {
                    params.fromDate = historyFromDate;
                }

                if (historyToDate) {
                    params.toDate = historyToDate;
                }

                if (historyStatusFilter !== "ALL") {
                    params.status = historyStatusFilter;
                }

                const response = await axiosInstance.get(
                    `/api/stock/history/${selectedClient.id}/${selectedModel.modelId}`,
                    { params }
                );

                const pageData: StockHistory[] = response.data.data || [];
                allHistory.push(...pageData);

                totalPages = response.data.pagination?.totalPages || 0;
                if (totalPages === 0) {
                    break;
                }

                page += 1;
            }

            if (allHistory.length === 0) {
                toast.warning("No data to export");
                return;
            }

            const exportRevertedGroupIds = buildRevertedGroupIds(allHistory);
            const data = allHistory
                .filter((record) => {
                    if (record.transferType === "REVERSAL") {
                        return false;
                    }

                    if (record.transferGroupId && exportRevertedGroupIds.has(record.transferGroupId)) {
                        return false;
                    }

                    return true;
                })
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

            XLSX.writeFile(workbook, `${selectedClient.companyName}_${selectedModel.model.name}_history.xlsx`);
            toast.success(`Report exported successfully (${data.length} rows)`);
        } catch (error) {
            console.error("Error exporting report:", error);
            toast.error("Failed to export report");
        } finally {
            setExporting(false);
        }
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

    const historyRangeStart = historyTotalCount === 0 ? 0 : (historyPage - 1) * historyPageSize + 1;
    const historyRangeEnd = historyTotalCount === 0 ? 0 : Math.min(historyPage * historyPageSize, historyTotalCount);

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
                        onClick={async () => {
                            if (selectedClient && selectedModel) {
                                setRefreshing(true);
                                try {
                                    await fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage });

                                    // Fetch updated inventory silently to update total current quantity
                                    const response = await axiosInstance.get(`/api/stock/client-inventory/${selectedClient.id}`);
                                    const stocks = response.data.inventory || [];
                                    setClientStocks(stocks);

                                    const updatedModel = stocks.find((s: ClientStock) => s.modelId === selectedModel.modelId);
                                    if (updatedModel) {
                                        setSelectedModel(updatedModel);
                                    }
                                } catch (error) {
                                    console.error("Error refreshing status:", error);
                                } finally {
                                    setRefreshing(false);
                                }
                            }
                        }}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-(--apl-cyan) text-white rounded-xl hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 font-medium"
                    >
                        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh Status"}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                        {exporting ? "Exporting..." : "Export Full Filtered"}
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">From Date</label>
                        <input
                            type="date"
                            value={historyFromDate}
                            onChange={(e) => setHistoryFromDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan)"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">To Date</label>
                        <input
                            type="date"
                            value={historyToDate}
                            onChange={(e) => setHistoryToDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan)"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Status</label>
                        <select
                            value={historyStatusFilter}
                            onChange={(e) => setHistoryStatusFilter(e.target.value as HistoryStatusFilter)}
                            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-(--apl-cyan)"
                        >
                            <option value="ALL">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="xl:col-span-2 flex items-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (historyFromDate && historyToDate && historyFromDate > historyToDate) {
                                    toast.warning("From date must be earlier than To date");
                                    return;
                                }

                                if (selectedClient && selectedModel) {
                                    setHistoryPage(1);
                                    fetchHistory(selectedClient.id, selectedModel.modelId, { page: 1 });
                                }
                            }}
                            className="px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all font-medium"
                        >
                            Apply Filters
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const defaultStatus: HistoryStatusFilter = "ALL";
                                setHistoryFromDate("");
                                setHistoryToDate("");
                                setHistoryStatusFilter(defaultStatus);
                                setHistoryPage(1);

                                if (selectedClient && selectedModel) {
                                    fetchHistory(selectedClient.id, selectedModel.modelId, {
                                        page: 1,
                                        fromDate: "",
                                        toDate: "",
                                        status: defaultStatus,
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-all font-medium"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {loading ? (
                    <LoadingPanel message="Loading history..." showSpinner={showLoadingIndicator} />
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No transactions found</div>
                ) : (
                    <div className="space-y-4">
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
                                        <th className="text-center py-3 px-4 text-slate-400 font-medium">Action</th>
                                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Performed By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((record) => (
                                        <tr
                                            key={record.id}
                                            className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${record.status === "PENDING"
                                                ? "bg-yellow-500/10"
                                                : isRevertedOrReversal(record)
                                                    ? "bg-red-500/10"
                                                    : ""
                                                }`}
                                        >
                                            <td className="py-3 px-4 text-slate-300">
                                                {new Date(record.createdAt).toLocaleString()}
                                                {record.status === "PENDING" && (
                                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 uppercase tracking-wider">
                                                        Pending
                                                    </span>
                                                )}
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
                                            <td className="py-3 px-4 text-center">
                                                {record.status === "PENDING" && record.transferGroupId ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        {(() => {
                                                            const isActioning = actioningGroupId === record.transferGroupId;

                                                            return (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleProceedTransfer(record.transferGroupId!)}
                                                                        disabled={isActioning}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50 font-medium text-xs"
                                                                        title="Approve & Complete"
                                                                    >
                                                                        {isActioning ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                                        {isActioning ? "Working..." : "Proceed"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditClick(record)}
                                                                        disabled={isActioning}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50 font-medium text-xs"
                                                                        title="Edit Details"
                                                                    >
                                                                        {isActioning ? <RefreshCw size={14} className="animate-spin" /> : <Edit size={14} />}
                                                                        {isActioning ? "Working..." : "Edit"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleCancelTransfer(record.transferGroupId!)}
                                                                        disabled={isActioning}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 font-medium text-xs"
                                                                        title="Cancel & Suspend"
                                                                    >
                                                                        {isActioning ? <RefreshCw size={14} className="animate-spin" /> : <Ban size={14} />}
                                                                        {isActioning ? "Working..." : "Cancel"}
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-300">{record.user.fullName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-white/5 pt-4">
                            <p className="text-sm text-slate-400">
                                Showing <span className="text-white font-medium">{historyRangeStart}-{historyRangeEnd}</span> of <span className="text-white font-medium">{historyTotalCount}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedClient && selectedModel && historyPage > 1) {
                                            fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage - 1 });
                                        }
                                    }}
                                    disabled={historyPage <= 1}
                                    className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-sm text-slate-300 min-w-27.5 text-center">
                                    Page {historyPage} of {Math.max(historyTotalPages, 1)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedClient && selectedModel && historyPage < historyTotalPages) {
                                            fetchHistory(selectedClient.id, selectedModel.modelId, { page: historyPage + 1 });
                                        }
                                    }}
                                    disabled={historyPage >= historyTotalPages}
                                    className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
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

            {showEditModal && recordToEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800/95 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Edit size={20} className="text-blue-400" />
                                Edit Pending Transfer
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setRecordToEdit(null);
                                }}
                                disabled={actioningGroupId !== null}
                                className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                                    disabled={actioningGroupId !== null}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">AWB</label>
                                <input
                                    type="text"
                                    value={editFormData.awb}
                                    onChange={(e) => setEditFormData({ ...editFormData, awb: e.target.value })}
                                    disabled={actioningGroupId !== null}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Job No</label>
                                <input
                                    type="text"
                                    value={editFormData.jobNo}
                                    onChange={(e) => setEditFormData({ ...editFormData, jobNo: e.target.value })}
                                    disabled={actioningGroupId !== null}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setRecordToEdit(null);
                                }}
                                disabled={actioningGroupId !== null}
                                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmEdit}
                                disabled={actioningGroupId !== null || !editFormData.quantity}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium w-32 flex justify-center items-center"
                            >
                                {actioningGroupId ? <RefreshCw size={18} className="animate-spin" /> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Report;
