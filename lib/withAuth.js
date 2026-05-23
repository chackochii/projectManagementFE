"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        // 1. Check for token/user in localStorage
        const token = localStorage.getItem("employeeToken");
        const user = localStorage.getItem("employeeUser");

        if (!token || !user) {
          // 2. Redirect to login if not found
          router.replace("/");
        } else {
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      };

      checkAuth();
    }, [router]);

    // 3. Show nothing or a spinner while checking
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    // 4. If authenticated, render the component
    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;
