import React, { useState } from "react";

interface GatekeeperProps {
    onUnlock: () => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        const APP_PASSWORD = "123"; // Later linked to .env via Backend

        if (password === APP_PASSWORD) {
            sessionStorage.setItem("apl_app_authorized", "true");
            onUnlock();
        } else {
            setError(true);
            setPassword("");
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
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[var(--apl-cyan)] to-[var(--apl-green)] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
                    >
                        Unlock System
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