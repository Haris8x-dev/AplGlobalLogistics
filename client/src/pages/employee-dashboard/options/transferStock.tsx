import React, { useState } from "react";
import { ArrowRightLeft, Send } from "lucide-react";

const TransferStock = () => {
    const [formData, setFormData] = useState({
        fromClient: "",
        toClient: "",
        model: "",
        quantity: "",
        transferType: "TransferOut",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Transfer submitted:", formData);
        // TODO: API call will go here
    };

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-1">
                    Transfer <span className="text-[var(--apl-cyan)]">Stock</span>
                </h1>
                <p className="text-slate-400 text-sm">Move inventory between clients</p>
            </div>

            {/* Form Card */}
            <div className="max-w-2xl bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <ArrowRightLeft className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Stock Transfer</h2>
                        <p className="text-xs text-slate-400">Transfer inventory from one client to another</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* From Client */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            From Client <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.fromClient}
                            onChange={(e) => setFormData({ ...formData, fromClient: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                            required
                        >
                            <option value="">Select source client...</option>
                            <option value="client1">ABC Corporation</option>
                            <option value="client2">XYZ Enterprises</option>
                            <option value="client3">Tech Solutions Inc.</option>
                        </select>
                    </div>

                    {/* To Client */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            To Client <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.toClient}
                            onChange={(e) => setFormData({ ...formData, toClient: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                            required
                        >
                            <option value="">Select destination client...</option>
                            <option value="client1">ABC Corporation</option>
                            <option value="client2">XYZ Enterprises</option>
                            <option value="client3">Tech Solutions Inc.</option>
                        </select>
                    </div>

                    {/* Transfer Direction Indicator */}
                    <div className="flex items-center justify-center py-2">
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <span className="text-red-400 font-medium text-sm">
                                    {formData.fromClient || "Source"}
                                </span>
                            </div>
                            <ArrowRightLeft className="text-[var(--apl-cyan)]" size={24} />
                            <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <span className="text-green-400 font-medium text-sm">
                                    {formData.toClient || "Destination"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Select Model <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                            required
                        >
                            <option value="">Choose a model...</option>
                            <option value="model1">iPhone 15 Pro</option>
                            <option value="model2">Samsung Galaxy S24</option>
                            <option value="model3">Google Pixel 8</option>
                        </select>
                    </div>

                    {/* Quantity */}
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
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Available: 150 units</p>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Transfer Note (Optional)
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Add transfer details or reason..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[var(--apl-cyan)] transition-colors resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
                    >
                        <Send size={20} />
                        Transfer Stock
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransferStock;
