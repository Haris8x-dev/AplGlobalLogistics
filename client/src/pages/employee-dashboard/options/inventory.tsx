import { useState } from "react";
import { Package, Search } from "lucide-react";

const Inventory = () => {
    const [searchTerm, setSearchTerm] = useState("");

    // Dummy data
    const inventoryData = [
        {
            id: 1,
            client: "ABC Corporation",
            model: "iPhone 15 Pro",
            category: "Premium",
            stock: 125,
            lastUpdated: "2026-03-08",
        },
        {
            id: 2,
            client: "XYZ Enterprises",
            model: "Samsung Galaxy S24",
            category: "Flagship",
            stock: 89,
            lastUpdated: "2026-03-07",
        },
        {
            id: 3,
            client: "Tech Solutions Inc.",
            model: "Google Pixel 8",
            category: "Mid-Range",
            stock: 56,
            lastUpdated: "2026-03-06",
        },
        {
            id: 4,
            client: "ABC Corporation",
            model: "OnePlus 12",
            category: "Premium",
            stock: 34,
            lastUpdated: "2026-03-05",
        },
        {
            id: 5,
            client: "Digital Solutions",
            model: "Xiaomi 14 Pro",
            category: "Mid-Range",
            stock: 78,
            lastUpdated: "2026-03-04",
        },
    ];

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">
                    Inventory <span className="text-[var(--apl-cyan)]">Overview</span>
                </h1>
                <p className="text-slate-400 text-sm">View current stock levels across all clients</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by client or model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--apl-cyan)]/10 rounded-xl flex items-center justify-center">
                            <Package className="text-[var(--apl-cyan)]" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Items</p>
                            <p className="text-2xl font-bold text-white">382</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <Package className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Active Models</p>
                            <p className="text-2xl font-bold text-white">12</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <Package className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Clients</p>
                            <p className="text-2xl font-bold text-white">8</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-slate-900/50 border-b border-white/5">
                    <p className="text-sm text-slate-400">
                        Showing <span className="text-[var(--apl-cyan)] font-semibold">{inventoryData.length}</span> inventory records
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {inventoryData.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{item.client}</td>
                                    <td className="px-6 py-4 text-slate-300">{item.model}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center px-3 py-1 bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)] rounded-full text-sm font-semibold">
                                            {item.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{item.lastUpdated}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
