import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";

interface AdminProtectedProps {
    children: React.ReactNode;
}

const AdminProtected = ({ children }: AdminProtectedProps) => {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyAdminAccess = async () => {
            try {
                console.log("🔍 AdminProtected: Calling verify-admin API...");

                const response = await axiosInstance.get("/api/auth/verify-admin");

                console.log("✅ AdminProtected: API Response:", response.data);

                if (response.data.success && response.data.user.isAdmin === true) {
                    console.log("✅ AdminProtected: Access granted");
                    setIsVerified(true);
                } else {
                    console.log("❌ AdminProtected: Access denied - not admin");
                    setIsVerified(false);
                }
            } catch (error: any) {
                console.error("❌ AdminProtected: Verification failed:", error.response?.data || error.message);
                setIsVerified(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAdminAccess();
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[var(--apl-bg-dark)]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--apl-cyan)]/30 border-t-[var(--apl-cyan)] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[var(--apl-cyan)] text-lg animate-pulse">
                        Verifying admin access...
                    </p>
                </div>
            </div>
        );
    }

    // Redirect if not verified as admin
    if (!isVerified) {
        return <Navigate to="/login" replace />;
    }

    // Render protected content
    return <>{children}</>;
};

export default AdminProtected;
