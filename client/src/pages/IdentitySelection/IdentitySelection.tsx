import React from "react";
import { useNavigate } from "react-router-dom";

const IdentitySelection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Glows (Moved to 3% opacity for a more subtle 'Executive' look) */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--apl-cyan)] opacity-[0.03] blur-[120px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--apl-magenta)] opacity-[0.03] blur-[120px]"></div>

            <div className="z-10 text-center mb-16">
                <h2 className="text-[var(--apl-cyan)] text-[10px] uppercase tracking-[6px] font-bold mb-3 opacity-80">
                    Security Gateway
                </h2>
                <h1 className="text-5xl font-bold text-white tracking-tight">
                    Select <span className="text-slate-500 font-light">Identity</span>
                </h1>
            </div>

            <div className="z-10 flex flex-col md:flex-row gap-8 w-full max-w-5xl px-10">

                {/* Admin Card */}
                <button
                    onClick={() => navigate('/admin-login')}
                    className="group relative flex-1 bg-white/[0.02] border border-white/5 p-12 rounded-[2.5rem] hover:border-[var(--apl-cyan)]/50 transition-all duration-500 hover:bg-white/[0.04] text-left overflow-hidden shadow-2xl"
                >
                    <div className="h-16 w-16 rounded-2xl bg-[var(--apl-cyan)]/10 flex items-center justify-center mb-8 group-hover:bg-[var(--apl-cyan)] group-hover:shadow-[0_0_20px_rgba(38,193,237,0.4)] transition-all duration-500">
                        <svg className="w-8 h-8 text-[var(--apl-cyan)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">Administrator</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                        Full system control, user management, and core configuration.
                    </p>
                </button>

                {/* Employee Card */}
                <button
                    onClick={() => navigate('/employee-login')}
                    className="group relative flex-1 bg-white/[0.02] border border-white/5 p-12 rounded-[2.5rem] hover:border-[var(--apl-green)]/50 transition-all duration-500 hover:bg-white/[0.04] text-left overflow-hidden shadow-2xl"
                >


                    <div className="h-16 w-16 rounded-2xl bg-[var(--apl-green)]/10 flex items-center justify-center mb-8 group-hover:bg-[var(--apl-green)] group-hover:shadow-[0_0_20px_rgba(95,195,164,0.4)] transition-all duration-500">
                        <svg className="w-8 h-8 text-[var(--apl-green)] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">Employee</h3>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[200px]">
                        Daily operations, stock entry, and client transfer management.
                    </p>
                </button>

            </div>

            {/* Lock System Action */}
            <button
                onClick={() => {
                    sessionStorage.removeItem("apl_app_authorized");
                    window.location.reload();
                }}
                className="mt-20 group flex items-center gap-3 text-slate-600 hover:text-[var(--apl-magenta)] transition-all"
            >
                <div className="h-[1px] w-8 bg-slate-800 group-hover:bg-[var(--apl-magenta)]/30 transition-all"></div>
                <span className="text-[10px] uppercase tracking-[3px] font-bold">Lock Terminal</span>
                <div className="h-[1px] w-8 bg-slate-800 group-hover:bg-[var(--apl-magenta)]/30 transition-all"></div>
            </button>
        </div>
    );
};

export default IdentitySelection;