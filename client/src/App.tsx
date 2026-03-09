import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Gatekeeper from "./pages/Gatekeeper/Gatekeeper";
import IdentitySelection from "./pages/IdentitySelection/IdentitySelection";
import AdminLogin from "./pages/admin-login/AdminLogin"; // Added
import EmployeeLogin from "./pages/employee-login/EmployeeLogin"; // Added
import AdminDashboard from "./pages/admin-dashboard/display/display"; // Added
import EmployeeDashboard from "./pages/employee-dashboard/display/display"; // Added

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if they already entered the system password in this session
  useEffect(() => {
    const authStatus = sessionStorage.getItem("apl_app_authorized");
    if (authStatus === "true") {
      setIsAuthorized(true);
    }
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      // Once the Gatekeeper is passed, we always send them to role selection
      element: <Navigate to="/login" replace />,
    },
    {
      path: "/login",
      element: <IdentitySelection />,
    },
    {
      path: "/admin-login",
      element: <AdminLogin />,
    },
    {
      path: "/employee-login",
      element: <EmployeeLogin />,
    },
    {
      path: "/admin-dashboard",
      element: <AdminDashboard />,
    },
    {
      path: "/employee-dashboard",
      element: <EmployeeDashboard />,
    },
    // Fallback: if user tries to access a non-existent route, send to /login
    {
      path: "*",
      element: <Navigate to="/login" replace />,
    },
  ]);

  // LEVEL 1 SECURITY: The System Gatekeeper
  if (!isAuthorized) {
    return (
      <>
        <Gatekeeper onUnlock={() => setIsAuthorized(true)} />
        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </>
    );
  }

  // LEVEL 2: The Router (Selection -> Login -> Dashboard)
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </>
  );
}

export default App;