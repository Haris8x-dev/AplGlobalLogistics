import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Gatekeeper from "./pages/Gatekeeper/Gatekeeper";
import IdentitySelection from "./pages/IdentitySelection/IdentitySelection";
import AdminLogin from "./pages/admin-login/AdminLogin";
import EmployeeLogin from "./pages/employee-login/EmployeeLogin";
import AdminDashboard from "./pages/admin-dashboard/display/display";
import EmployeeDashboard from "./pages/employee-dashboard/display/display";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if they already entered the system password in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem("apl_app_authorized");
    if (authStatus === "true") {
      setIsAuthorized(true);
    }
  }, []);

  // If not authorized, show Gatekeeper
  if (!isAuthorized) {
    return (
      <>
        <Gatekeeper onUnlock={() => setIsAuthorized(true)} />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<IdentitySelection />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </HashRouter>
  );
}

export default App;
