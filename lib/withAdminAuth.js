"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const withAdminAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAdminAuth = () => {
        // Look for the specific ADMIN keys you set in AdminLoginPage
        const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
        const user = localStorage.getItem("employeeUser");

        if (!token|| user) {
          // If not an admin, redirect to Admin Login, not "/"
          router.replace("/admin/adminLogin");
        } else {
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      };

      checkAdminAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };
};

export default withAdminAuth;
