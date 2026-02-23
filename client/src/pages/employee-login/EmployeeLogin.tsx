import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ id: "", password: "" });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Employee Login Attempt:", formData);
        navigate("/dashboard");
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--apl-bg-dark)] relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--apl-green)] opacity-[0.03] blur-[120px]"></div>

            <div className="z-10 w-full max-w-md p-8 bg-slate-800/20 border border-white/5 backdrop-blur-xl rounded-[2rem] shadow-2xl">
                <button
                    onClick={() => navigate('/login')}
                    className="group text-slate-500 hover:text-[var(--apl-green)] text-[10px] tracking-widest font-bold mb-10 flex items-center gap-2 transition-all uppercase"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Selection
                </button>

                <div className="mb-10 text-center">
                    <div className="text-[var(--apl-green)] text-[10px] font-bold uppercase tracking-[4px] mb-3">Staff Portal</div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Employee <span className="text-slate-500 font-light">Login</span></h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Staff ID</label>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-green)] focus:ring-1 focus:ring-[var(--apl-green)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="e.g. staff_102"
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-green)] focus:ring-1 focus:ring-[var(--apl-green)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button className="w-full py-5 mt-4 bg-gradient-to-r from-[var(--apl-green)] to-[#4eb192] text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployeeLogin;