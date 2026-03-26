import { useState } from "react";
import SidePanel from "../options/sidePanel";
import AddStock from "../options/addStock";
import TransferStock from "../options/transferStock";
import LogoutModal from "../../../components/blocks/logoutModel";
import Report from "../options/Report";
// import Inventory from "../options/inventory";
// import RecentActivity from "../options/recentActivity";

const Display = () => {
    const [activeSection, setActiveSection] = useState("addStock");
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const renderSection = () => {
        switch (activeSection) {
            case "addStock":
                return <AddStock />;
            case "transferStock":
                return <TransferStock />;
            case "report":
                return <Report />;
            // case "inventory":
            //     return <Inventory />;
            // case "recentActivity":
            //     return <RecentActivity />;
            default:
                return <AddStock />;
        }
    };

    return (
        <div className="flex h-screen">
            <SidePanel
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onLogoutClick={() => setShowLogoutModal(true)}
            />
            <div className="flex-1 overflow-auto">{renderSection()}</div>

            {/* Logout Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
            />
        </div>
    );
};

export default Display;