import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface GatekeeperProps {
    onUnlock: () => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/config/validate-password",
                { password },
                { withCredentials: true }
            );

            if (response.data.success && response.data.isValid) {
                sessionStorage.setItem("apl_app_authorized", "true");
                toast.success("Access granted");
                onUnlock();
            }
        } catch (error: any) {
            console.error("Password validation error:", error);
            setError(true);
            setPassword("");

            if (error.response?.status === 404) {
                toast.error("System password not configured. Please contact administrator.");
            } else if (error.response?.status === 401) {
                toast.error("Invalid access key");
            } else {
                toast.error(error.response?.data?.message || "Failed to validate password");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--apl-bg-dark)] font-['Inter',_sans-serif]">
            {/* Import Inter Font */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');`}
            </style>

            {/* Background Glows for Depth */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--apl-cyan)] opacity-5 blur-[120px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--apl-magenta)] opacity-5 blur-[120px]"></div>

            <div className="z-10 w-full max-w-md p-8 text-center">
                {/* Logo Placeholder / Icon */}
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-cyan-500/20">
                    <img src="/src/assets/apl-core-logo.png" alt="APL Core Logo" className="h-16 w-16" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                    APL <span className="text-[var(--apl-cyan)]">CORE</span>
                </h1>
                <p className="text-slate-400 font-light mb-10 tracking-wide uppercase text-xs">
                    Global Logistics Internal Systems
                </p>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(false);
                            }}
                            placeholder="System Access Key"
                            className={`w-full px-5 py-4 rounded-xl bg-slate-800/50 border backdrop-blur-sm text-white transition-all duration-300 placeholder:text-slate-500
                ${error
                                    ? 'border-[var(--apl-magenta)] ring-2 ring-[var(--apl-magenta)]/20'
                                    : 'border-slate-700 focus:border-[var(--apl-cyan)] focus:ring-2 focus:ring-[var(--apl-cyan)]/20'
                                }`}
                        />
                    </div>

                    {error && (
                        <p className="text-[var(--apl-magenta)] text-sm font-medium animate-pulse">
                            Invalid access key. Please try again.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--apl-cyan)] to-[var(--apl-green)] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            "Unlock System"
                        )}
                    </button>
                </form>

                <p className="mt-12 text-slate-500 text-[10px] uppercase tracking-[2px]">
                    Authorized Personnel Only • Secure Session
                </p>
            </div>
        </div>
    );
};

export default Gatekeeper;