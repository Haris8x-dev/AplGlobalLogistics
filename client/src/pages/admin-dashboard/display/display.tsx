
import React, { useState } from "react";
import SidePanel from "../options/sidePanel";
import Dashboard from "../options/dashboard";
import ManageClients from "../options/manageClients";
import ManageCat from "../options/manageCat";
import ManageModels from "../options/manageModels";
import ManageUsers from "../options/manageUsers";
import WrapUp from "../options/wrapUp";

const Display = () => {
    const [activeSection, setActiveSection] = useState("dashboard");

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
            case "wrapUp":
                return <WrapUp />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-[var(--apl-bg-dark)]">
            <SidePanel activeSection={activeSection} setActiveSection={setActiveSection} />
            <div className="flex-1 overflow-auto">
                {renderSection()}
            </div>
        </div>
    );
};

export default Display;