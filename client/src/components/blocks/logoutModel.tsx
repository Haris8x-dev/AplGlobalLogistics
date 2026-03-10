import React from "react";
import { AlertCircle, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogout = async () => {
        try {
            await axios.post(
                "http://localhost:5000/api/auth/logout",
                {},
                { withCredentials: true }
            );

            // Clear session storage
            sessionStorage.removeItem("apl_user_role");
            sessionStorage.removeItem("apl_is_admin");

            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle className="text-red-400" size={32} />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                    Confirm Logout
                </h2>

                {/* Message */}
                <p className="text-slate-400 text-center mb-6">
                    Are you sure you want to logout? You'll need to sign in again to access your account.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-white/5 text-slate-300 hover:bg-slate-700 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all font-medium"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
