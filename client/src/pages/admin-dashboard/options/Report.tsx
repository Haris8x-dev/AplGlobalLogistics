import { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import { ArrowLeft, Search, Download, Package, TrendingUp, TrendingDown, FileSpreadsheet, Eye, RefreshCw } from "lucide-react";
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
    message: string;
    createdAt: string;
    user: {
        fullName: string;
    };
    model: {
        name: string;
    };
}

const Report = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientStocks, setClientStocks] = useState<ClientStock[]>([]);
    const [selectedModel, setSelectedModel] = useState<ClientStock | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [searchClients, setSearchClients] = useState("");
    const [searchModels, setSearchModels] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
            const clientsData = response.data.clients || [];

            // Fetch stock count for each client
            const clientsWithStock = await Promise.all(
                clientsData.map(async (client: Client) => {
                    try {
                        const stockRes = await axiosInstance.get(
                            `/api/stock/client-inventory/${client.id}`
                        );
                        return {
                            ...client,
                            _count: { clientStocks: stockRes.data.inventory?.length || 0 }
                        };
                    } catch (error) {
                        return { ...client, _count: { clientStocks: 0 } };
                    }
                })
            );

            setClients(clientsWithStock);
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

    const exportToExcel = () => {
        if (history.length === 0) {
            toast.warning("No data to export");
            return;
        }

        const data = history.map((record) => ({
            "Date": new Date(record.createdAt).toLocaleString(),
            "Type": record.transferType || "TRANSFER",
            "Model": record.model.name,
            "Quantity": record.quantity,
            "Message": record.message || "-",
            "Performed By": record.user.fullName,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
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
        stock.model.name.toLowerCase().includes(searchModels.toLowerCase())
    );

    // View 1: Clients Table
    if (!selectedClient) {
        return (
            <div className="p-6 min-h-screen relative">
                {/* Beautiful Loading Overlay */}
                {refreshing && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-white font-semibold text-lg mb-1">Refreshing Reports</h3>
                                    <p className="text-slate-400 text-sm">Fetching latest data...</p>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    <div className="text-center py-12 text-slate-400">Loading clients...</div>
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
                {/* Beautiful Loading Overlay */}
                {refreshing && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-white font-semibold text-lg mb-1">Refreshing Inventory</h3>
                                    <p className="text-slate-400 text-sm">Fetching latest data...</p>
                                </div>
                            </div>
                        </div>
                    </div>
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

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
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
                        <div className="text-center py-8 text-slate-400">Loading inventory...</div>
                    ) : filteredStocks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No inventory found for this client</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredStocks.map((stock) => (
                                <button
                                    key={stock.id}
                                    onClick={() => handleModelClick(stock)}
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-(--apl-cyan) transition-all text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                            <Package className="text-purple-400" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-semibold">{stock.model.name}</h3>
                                            <p className="text-slate-400 text-sm">{stock.model.category.name}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-slate-500">Stock:</span>
                                                <span className="text-lg font-bold text-(--apl-cyan)">
                                                    {stock.currentBalance}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // View 3: History Details
    return (
        <div className="p-6 min-h-screen relative">
            {/* Beautiful Loading Overlay */}
            {refreshing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-semibold text-lg mb-1">Refreshing History</h3>
                                <p className="text-slate-400 text-sm">Fetching latest data...</p>
                            </div>
                        </div>
                    </div>
                </div>
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
                    <div className="text-center py-8 text-slate-400">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No transactions found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Date & Time</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Model</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Quantity</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Message</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Performed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record) => (
                                    <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                        <td className="py-3 px-4 text-slate-300">
                                            {new Date(record.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${record.transferType === "INITIAL_LOAD"
                                                    ? "bg-cyan-500/10 text-cyan-400"
                                                    : "bg-purple-500/10 text-purple-400"
                                                    }`}
                                            >
                                                {record.transferType || "TRANSFER"}
                                            </span>
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
                                        <td className="py-3 px-4 text-slate-400">
                                            {record.message || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-slate-300">{record.user.fullName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Report;
