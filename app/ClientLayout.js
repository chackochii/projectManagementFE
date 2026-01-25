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
      <div className="flex min-h-screen bg-slate-950">
        {!noLayout && <Sidebar />}

        <div className={`flex-1 flex flex-col min-h-screen ${!noLayout ? "md:ml-64" : ""}`}>
          {!noLayout && <Topbar />}

          <main className={`w-full flex-1 ${noLayout ? "p-0 m-0" : "p-4 md:p-6 lg:p-8"}`}>
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
