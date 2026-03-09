import React, { useState } from "react";
import SidePanel from "../options/sidePanel";
import AddStock from "../options/addStock";
import TransferStock from "../options/transferStock";
import Inventory from "../options/inventory";
import RecentActivity from "../options/recentActivity";

const Display = () => {
    const [activeSection, setActiveSection] = useState("addStock");

    const renderSection = () => {
        switch (activeSection) {
            case "addStock":
                return <AddStock />;
            case "transferStock":
                return <TransferStock />;
            case "inventory":
                return <Inventory />;
            case "recentActivity":
                return <RecentActivity />;
            default:
                return <AddStock />;
        }
    };

    return (
        <div className="flex h-screen">
            <SidePanel activeSection={activeSection} setActiveSection={setActiveSection} />
            <div className="flex-1 overflow-auto">{renderSection()}</div>
        </div>
    );
};

export default Display;