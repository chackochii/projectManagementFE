"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { ProjectProvider } from "./context/ProjectContext";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const noLayout = useMemo(() => {
    const hideLayout = pathname.startsWith("/admin");
    const isLoginPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);
    return hideLayout || isLoginPage;
  }, [pathname]);

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-slate-950 overflow-x-hidden">
        {!noLayout && <Sidebar />}

        <div
          className={`min-h-screen flex flex-col ${
            noLayout ? "ml-0" : "ml-0 md:ml-64"
          }`}
        >
          {!noLayout && <Topbar />}

          <main
            className={`flex-1 ${
              noLayout ? "p-0" : "p-4 md:p-6 lg:p-8"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
