import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Search, Download, Users as UsersIcon, Package, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

interface Client {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
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

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/admin/clients/all", {
                withCredentials: true,
            });
            setClients(response.data.clients || []);
        } catch (error) {
            toast.error("Failed to fetch clients");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientStocks = async (clientId: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/stock/client-inventory/${clientId}`, {
                withCredentials: true,
            });
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
            const response = await axios.get(
                `http://localhost:5000/api/stock/history/${clientId}/${modelId}`,
                { withCredentials: true }
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

    const filteredClients = clients.filter((client) =>
        client.companyName.toLowerCase().includes(searchClients.toLowerCase())
    );

    const filteredStocks = clientStocks.filter((stock) =>
        stock.model.name.toLowerCase().includes(searchModels.toLowerCase())
    );

    // View 1: Clients List
    if (!selectedClient) {
        return (
            <div className="p-6 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Client <span className="text-(--apl-cyan)">Reports</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Select a client to view detailed inventory reports</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchClients}
                                onChange={(e) => setSearchClients(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-(--apl-cyan)"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading clients...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => handleClientClick(client)}
                                    className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-(--apl-cyan) transition-all text-left"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-(--apl-cyan)/10 rounded-lg flex items-center justify-center">
                                            <UsersIcon className="text-(--apl-cyan)" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-semibold">{client.companyName}</h3>
                                            <p className="text-slate-400 text-sm">{client.contactName || "N/A"}</p>
                                            <p className="text-slate-500 text-xs mt-1">{client.email}</p>
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

    // View 2: Models List
    if (selectedClient && !selectedModel) {
        return (
            <div className="p-6 min-h-screen">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Clients
                </button>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {selectedClient.companyName} <span className="text-(--apl-cyan)">Inventory</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Select a model to view transaction history</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="p-6 min-h-screen">
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
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all"
                >
                    <Download size={18} />
                    Export Excel
                </button>
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