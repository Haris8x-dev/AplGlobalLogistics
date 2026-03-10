import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeLogin: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login/employee",
                formData,
                {
                    withCredentials: true, // Important for cookies
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // Success - redirect based on role
            if (response.data.role === "EMPLOYEE") {
                toast.success("Login successful! Welcome back.");
                navigate("/employee-dashboard");
            } else if (response.data.role === "ADMIN") {
                toast.error("Please use the Admin login portal");
            } else {
                toast.error("Access denied: Invalid role");
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            // Axios puts server response in err.response.data
            if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else if (err.response) {
                toast.error("Login failed. Please try again.");
            } else {
                toast.error("Server connection error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
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
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Staff Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-green)] focus:ring-1 focus:ring-[var(--apl-green)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="employee@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-slate-400 text-[11px] uppercase tracking-wider ml-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-slate-900/40 border border-slate-700/50 text-white focus:border-[var(--apl-green)] focus:ring-1 focus:ring-[var(--apl-green)]/20 outline-none transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 mt-4 bg-gradient-to-r from-[var(--apl-green)] to-[#4eb192] text-white font-bold text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Authenticating..." : "Access Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployeeLogin;