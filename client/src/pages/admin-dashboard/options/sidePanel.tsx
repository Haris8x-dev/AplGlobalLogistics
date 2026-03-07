import React from "react";
import { LayoutDashboard, Users, Package, Smartphone, FolderTree, LogOut } from "lucide-react";

interface SidePanelProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ activeSection, setActiveSection }) => {
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "manageClients", label: "Manage Clients", icon: Users },
        { id: "manageCat", label: "Manage Categories", icon: FolderTree },
        { id: "manageModels", label: "Manage Models", icon: Smartphone },
        { id: "manageUsers", label: "Manage Users", icon: Package },
        { id: "report", label: "Report", icon: LogOut },
    ];

    return (
        <div className="w-72 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <h1 className="text-2xl font-bold text-white">
                    Admin <span className="text-[var(--apl-cyan)]">Portal</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Control Center</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                transition-all duration-200 text-left
                                ${isActive
                                    ? "bg-[var(--apl-cyan)]/10 text-[var(--apl-cyan)] border border-[var(--apl-cyan)]/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                                }
                            `}
                        >
                            <Icon size={20} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-left">
                    <LogOut size={20} />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default SidePanel;