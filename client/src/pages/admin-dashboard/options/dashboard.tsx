import { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosConfig";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
    Package, ShoppingCart, Activity, Users, RefreshCw, UserCheck, MessageSquare, X
} from "lucide-react";

interface StockMovement {
    id: string;
    quantity: number;
    transferType: string;
    message: string | null;
    jobNo: string;
    awb: string;
    movementDate: string;
    transferGroupId: string | null;
    fromClientId: string | null;
    toClientId: string | null;
    fromClient: { companyName: string } | null;
    toClient: { companyName: string } | null;
    createdAt: string;
    status: string;
    clientId: string;
    modelId: string;
    user: { fullName: string };
    model: { name: string };
    client: { companyName: string };
}

interface TrendData {
    date: string;
    movements: number;
}

const Dashboard = () => {
    const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
    const [inventoryTrend, setInventoryTrend] = useState<TrendData[]>([]);
    const [totalCategories, setTotalCategories] = useState(0);
    const [totalModels, setTotalModels] = useState(0);
    const [totalClients, setTotalClients] = useState(0);
    const [totalMovements, setTotalMovements] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [showMessageModal, setShowMessageModal] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setDashboardRefreshing(true);
            } else {
                setLoading(true);
            }

            // Fetch recent movements
            const movementsRes = await axiosInstance.get(
                "/api/stock/recent-activity?limit=50"
            );
            const movements = movementsRes.data.data || [];
            setRecentMovements(movements);
            setTotalMovements(movements.length);

            // Calculate trend data from movements (current month only)
            const trendMap = new Map<string, number>();
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            // Initialize from day 1 of current month to last day of month
            const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            for (let i = 0; i < daysInCurrentMonth; i++) {
                const date = new Date(currentYear, currentMonth, i + 1);
                const dateStr = date.toISOString().split('T')[0];
                trendMap.set(dateStr, 0);
            }

            // Count movements per day
            movements.forEach((movement: StockMovement) => {
                const date = new Date(movement.createdAt).toISOString().split('T')[0];
                if (trendMap.has(date)) {
                    trendMap.set(date, (trendMap.get(date) || 0) + 1);
                }
            });

            // Convert to array with formatted dates
            const trendData: TrendData[] = Array.from(trendMap.entries()).map(([date, movements]) => {
                const dateObj = new Date(date);
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const day = dateObj.getDate();
                return {
                    date: `${month} ${day}`,
                    movements
                };
            });
            setInventoryTrend(trendData);

            // Fetch all categories
            const categoriesRes = await axiosInstance.get(
                "/api/admin/inventory/admin-inventory"
            );
            const categories = categoriesRes.data.inventory || [];
            setTotalCategories(categories.length);

            // Fetch all models
            const modelsRes = await axiosInstance.get(
                "/api/admin/inventory/models"
            );
            const models = modelsRes.data.models || [];
            setTotalModels(models.length);

            // Fetch clients count (we'll need to add this endpoint or use existing data)
            // For now, extract unique clients from movements
            const uniqueClients = new Set(movements.map((m: StockMovement) => m.client.companyName));
            setTotalClients(uniqueClients.size);

            // Fetch total users
            const usersRes = await axiosInstance.get(
                "/api/auth/getAuth"
            );
            setTotalUsers(usersRes.data.totalUsers || 0);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            if (isRefresh) {
                setDashboardRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const handleRefreshMovements = async () => {
        try {
            setRefreshing(true);
            const movementsRes = await axiosInstance.get(
                "/api/stock/recent-activity?limit=50"
            );
            setRecentMovements(movementsRes.data.data || []);
        } catch (error) {
            console.error("Error refreshing movements:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handlePendingClick = (movement: StockMovement) => {
        if (movement.status === "PENDING") {
            sessionStorage.setItem("pendingReportAction", JSON.stringify({
                clientId: movement.clientId,
                modelId: movement.modelId
            }));
            window.dispatchEvent(new CustomEvent("navigateToReport"));
        }
    };

    // Calculate pie chart data from transfer types
    const getTransferTypeData = () => {
        const typeCount: { [key: string]: number } = {};

        recentMovements.forEach((movement) => {
            const type = movement.transferType || "TRANSFER";
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return Object.entries(typeCount).map(([name, value]) => ({
            name,
            value
        }));
    };

    const COLORS = ["#22d3ee", "#a855f7", "#f97316", "#10b981", "#ef4444"];

    if (loading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen relative">
            {/* Beautiful Loading Overlay */}
            {dashboardRefreshing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-(--apl-cyan) border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-semibold text-lg mb-1">Refreshing Dashboard</h3>
                                <p className="text-slate-400 text-sm">Fetching latest data...</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Dashboard <span className="text-(--apl-cyan)">Overview</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Real-time insights into your inventory system</p>
                </div>
                <button
                    onClick={() => fetchDashboardData(true)}
                    disabled={dashboardRefreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-(--apl-cyan) text-white rounded-xl hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 font-medium"
                >
                    <RefreshCw size={18} className={dashboardRefreshing ? "animate-spin" : ""} />
                    {dashboardRefreshing ? "Refreshing..." : "Refresh Dashboard"}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="text-(--apl-cyan)" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{totalModels}</h3>
                    <p className="text-slate-400 text-xs">Total Models</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <ShoppingCart className="text-purple-400" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{totalCategories}</h3>
                    <p className="text-slate-400 text-xs">Categories</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="text-orange-400" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{totalClients}</h3>
                    <p className="text-slate-400 text-xs">Total Clients</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="text-green-400" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{totalMovements}</h3>
                    <p className="text-slate-400 text-xs">Stock Movements</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <UserCheck className="text-blue-400" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{totalUsers}</h3>
                    <p className="text-slate-400 text-xs">Total Users</p>
                </div>
            </div>

            {/* Charts Grid: Area Chart + Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Area Chart - 2 columns */}
                <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Stock Movement Activity (Current Month)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={inventoryTrend}>
                            <defs>
                                <linearGradient id="colorMovements" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "8px",
                                    color: "#fff"
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="movements"
                                stroke="#22d3ee"
                                fill="url(#colorMovements)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart - 1 column */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Transfer Types</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={getTransferTypeData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={65}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {getTransferTypeData().map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e293b",
                                    border: "1px solid #334155",
                                    borderRadius: "8px",
                                    color: "#fff"
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Stock Ledger */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Stock Transfers</h3>
                    <button
                        onClick={handleRefreshMovements}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all disabled:opacity-50 text-sm"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Type</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">From</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">To</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Model</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Client</th>
                                <th className="text-right py-2 px-3 text-slate-400 font-medium">Qty</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Job No</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">AWB</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Movement Date</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">Entry Date</th>
                                <th className="text-left py-2 px-3 text-slate-400 font-medium">By</th>
                                <th className="text-center py-2 px-3 text-slate-400 font-medium">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMovements.slice(0, 15).map((movement) => {
                                const isPending = movement.status === "PENDING";
                                return (
                                    <tr
                                        key={movement.id}
                                        className={`border-b border-slate-700/50 transition-colors ${isPending ? 'bg-yellow-500/10 hover:bg-yellow-500/20 cursor-pointer' : 'hover:bg-slate-700/20'}`}
                                        onClick={() => isPending ? handlePendingClick(movement) : undefined}
                                    >
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-2">
                                                {isPending && (
                                                    <div className="w-2 h-2 rounded-full bg-yellow-400 relative" title="Pending Approval">
                                                        <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
                                                    </div>
                                                )}
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${movement.transferType === "INITIAL_LOAD"
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : "bg-purple-500/10 text-purple-400"
                                                        }`}
                                                >
                                                    {movement.transferType || "TRANSFER"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-slate-300 text-xs">
                                            {movement.fromClient ? movement.fromClient.companyName : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-slate-300 text-xs">
                                            {movement.toClient ? movement.toClient.companyName : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-white">{movement.model.name}</td>
                                        <td className="py-2 px-3 text-slate-300">{movement.client.companyName}</td>
                                        <td className="py-2 px-3 text-right">
                                            <span
                                                className={`font-semibold ${movement.quantity > 0 ? "text-green-400" : "text-red-400"
                                                    }`}
                                            >
                                                {movement.quantity > 0 ? "+" : ""}
                                                {movement.quantity}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-slate-300 text-xs">{movement.jobNo || "-"}</td>
                                        <td className="py-2 px-3 text-slate-300 text-xs">{movement.awb || "-"}</td>
                                        <td className="py-2 px-3 text-slate-400 text-xs">
                                            {movement.movementDate ? new Date(movement.movementDate).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-slate-400 text-xs">
                                            {new Date(movement.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-2 px-3 text-slate-400 text-xs">{movement.user.fullName}</td>
                                        <td className="py-2 px-3 text-center">
                                            {movement.message ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedMessage(movement.message);
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Modal */}
            {showMessageModal && selectedMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800/95 border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <MessageSquare size={20} className="text-(--apl-cyan)" />
                                Message
                            </h3>
                            <button
                                onClick={() => setShowMessageModal(false)}
                                className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage}</p>
                        </div>
                        <button
                            onClick={() => setShowMessageModal(false)}
                            className="w-full mt-4 px-4 py-2 bg-(--apl-cyan) text-white rounded-lg hover:bg-(--apl-cyan)/80 transition-all font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;