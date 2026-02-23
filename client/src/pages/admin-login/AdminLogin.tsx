import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ id: "", password: "", secretCode: "" });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for backend authentication goes here later
        console.log("Admin Login Attempt:", formData);
        navigate("/dashboard"); // Temporary redirect to test
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--apl-bg-dark)] relative overflow-hidden">
            {/* Dynamic Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--apl-cyan)] opacity-[0.03] blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--apl-magenta)] opacity-[0.03] blur-[120px]"></div>

            <div className="z-10 w-full max-w-md p-8 bg-slate-800/20 border border-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl">
                <button
                    onClick={() => navigate('/login')}
                    className="group text-slate-500 hover:text-[var(--apl-cyan)] text-[10px] tracking-widest font-bold mb-10 flex items-center gap-2 transition-all uppercase"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Selection
                </button>

                <div className="mb-10 text-center">
                    <div className="text-[var(--apl-cyan)] text-[10px] font-bold uppercase tracking-[4px] mb-3">Secure Terminal</div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Admin <span className="text-slate-500 font-light">Login</span></h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Administrator ID</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. admin_01"
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Master Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-cyan)] focus:ring-1 focus:ring-[var(--apl-cyan)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[var(--apl-magenta)] text-[11px] uppercase tracking-[2px] ml-1 font-bold">Secret Auth Code</label>
                        <input
                            type="password"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-[var(--apl-magenta)]/30 text-white focus:border-[var(--apl-magenta)] focus:ring-1 focus:ring-[var(--apl-magenta)]/20 outline-none transition-all placeholder:text-slate-700"
                            placeholder="Enter Private Code"
                            onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                        />
                    </div>

                    <button className="w-full py-5 mt-4 bg-gradient-to-r from-[var(--apl-cyan)] to-[#1da8d1] text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all">
                        Authorized Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;