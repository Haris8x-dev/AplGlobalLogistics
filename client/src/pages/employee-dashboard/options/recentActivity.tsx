import { Activity, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";

const RecentActivity = () => {
    // Dummy data
    const activities = [
        {
            id: 1,
            type: "INITIAL_LOAD",
            model: "iPhone 15 Pro",
            quantity: 50,
            client: "ABC Corporation",
            employee: "John Smith",
            timestamp: "2026-03-09 10:30 AM",
            message: "Initial stock load",
        },
        {
            id: 2,
            type: "TRANSFER",
            model: "Samsung Galaxy S24",
            quantity: -25,
            fromClient: "XYZ Enterprises",
            toClient: "Tech Solutions Inc.",
            employee: "Sarah Johnson",
            timestamp: "2026-03-09 09:15 AM",
            message: "Stock transfer as requested",
        },
        {
            id: 3,
            type: "RESTOCK",
            model: "Google Pixel 8",
            quantity: 30,
            client: "Digital Solutions",
            employee: "Mike Anderson",
            timestamp: "2026-03-08 04:45 PM",
            message: "Restocking inventory",
        },
        {
            id: 4,
            type: "TRANSFER",
            model: "OnePlus 12",
            quantity: -15,
            fromClient: "ABC Corporation",
            toClient: "XYZ Enterprises",
            employee: "John Smith",
            timestamp: "2026-03-08 02:20 PM",
            message: "Emergency transfer",
        },
        {
            id: 5,
            type: "RETURN",
            model: "Xiaomi 14 Pro",
            quantity: 10,
            client: "Tech Solutions Inc.",
            employee: "Emily Davis",
            timestamp: "2026-03-08 11:00 AM",
            message: "Product return from client",
        },
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case "INITIAL_LOAD":
                return "bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)]";
            case "TRANSFER":
                return "bg-purple-500/10 text-purple-400";
            case "RESTOCK":
                return "bg-green-500/10 text-green-400";
            case "RETURN":
                return "bg-orange-500/10 text-orange-400";
            default:
                return "bg-slate-500/10 text-slate-400";
        }
    };

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">
                    Recent <span className="text-(--apl-cyan)">Activity</span>
                </h1>
                <p className="text-slate-400 text-sm">Latest stock movements and transactions</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Today's Movements</p>
                            <p className="text-2xl font-bold text-white">24</p>
                        </div>
                        <Activity className="text-(--apl-cyan)" size={28} />
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Stock Added</p>
                            <p className="text-2xl font-bold text-green-400">+180</p>
                        </div>
                        <TrendingUp className="text-green-400" size={28} />
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Stock Removed</p>
                            <p className="text-2xl font-bold text-red-400">-65</p>
                        </div>
                        <TrendingDown className="text-red-400" size={28} />
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Transfers</p>
                            <p className="text-2xl font-bold text-purple-400">12</p>
                        </div>
                        <ArrowRightLeft className="text-purple-400" size={28} />
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Activity Timeline</h2>
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="relative pl-8 pb-6 border-l-2 border-slate-700 last:pb-0 last:border-transparent"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute -left-2.25 top-0 w-4 h-4 bg-(--apl-cyan) rounded-full border-4 border-slate-900"></div>

                            {/* Activity Card */}
                            <div className="bg-slate-900/50 border border-white/5 rounded-lg p-4 hover:bg-slate-900/80 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(activity.type)}`}>
                                            {activity.type}
                                        </span>
                                        <span className="text-white font-medium">{activity.model}</span>
                                    </div>
                                    <span
                                        className={`text-lg font-bold ${activity.quantity > 0 ? "text-green-400" : "text-red-400"
                                            }`}
                                    >
                                        {activity.quantity > 0 ? "+" : ""}
                                        {activity.quantity}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm">
                                    {activity.type === "TRANSFER" ? (
                                        <p className="text-slate-400">
                                            <span className="text-red-400">{activity.fromClient}</span>
                                            <ArrowRightLeft className="inline mx-2" size={14} />
                                            <span className="text-green-400">{activity.toClient}</span>
                                        </p>
                                    ) : (
                                        <p className="text-slate-400">
                                            Client: <span className="text-slate-300">{activity.client}</span>
                                        </p>
                                    )}
                                    <p className="text-slate-500 text-xs">{activity.message}</p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <span className="text-slate-500 text-xs">By: {activity.employee}</span>
                                        <span className="text-slate-500 text-xs">{activity.timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecentActivity;
