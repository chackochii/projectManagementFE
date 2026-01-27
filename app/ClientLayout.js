"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { ProjectProvider } from "./context/ProjectContext";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Memoize layout checks so they don't re-calculate on every small flicker
  const noLayout = useMemo(() => {
    const hideLayout = pathname.startsWith("/admin");
    const isLoginPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);
    return hideLayout || isLoginPage;
  }, [pathname]);

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-slate-950">
        {!noLayout && <Sidebar />}

        <div className="ml-0 md:ml-64 min-h-screen flex flex-col">
          {!noLayout && <Topbar />}

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
