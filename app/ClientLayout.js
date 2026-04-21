"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { ProjectProvider } from "./context/ProjectContext";

// Import your routes
const layoutRoutes = [
  "/dashboard",
  "/board",
  "/backlog",
  "/reports",
  "/leave",
  "/activeTickets",
  "/projects",
  "/dummy",
  "/empolyeeTask",
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const noLayout = useMemo(() => {
    // Logic: If the current pathname is NOT in the layoutRoutes list, then noLayout is true
    return !layoutRoutes.includes(pathname);
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
