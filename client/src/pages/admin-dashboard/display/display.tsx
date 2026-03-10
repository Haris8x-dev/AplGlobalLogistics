
import React, { useState } from "react";
import SidePanel from "../options/sidePanel";
import Dashboard from "../options/dashboard";
import ManageClients from "../options/manageClients";
import ManageCat from "../options/manageCat";
import ManageModels from "../options/manageModels";
import ManageUsers from "../options/manageUsers";
import Report from "../options/Report";
import Settings from "../options/settings";
import LogoutModal from "../../../components/blocks/logoutModel";


const Display = () => {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const renderSection = () => {
        switch (activeSection) {
            case "dashboard":
                return <Dashboard />;
            case "manageClients":
                return <ManageClients />;
            case "manageCat":
                return <ManageCat />;
            case "manageModels":
                return <ManageModels />;
            case "manageUsers":
                return <ManageUsers />;
            case "report":
                return <Report />;
            case "settings":
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-[var(--apl-bg-dark)]">
            <SidePanel
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onLogoutClick={() => setShowLogoutModal(true)}
            />
            <div className="flex-1 overflow-auto">
                {renderSection()}
            </div>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
            />
        </div>
    );
};

export default Display;