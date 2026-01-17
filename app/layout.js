"use client";

import "./globals.css";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { usePathname } from "next/navigation";
import { ProjectProvider } from "./context/ProjectContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const hideLayout = pathname.startsWith("/admin");
  const isLoginPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);
  const noLayout = hideLayout || isLoginPage;

  return (
    <html lang="en">
      <body className={`text-white min-h-screen ${noLayout ? "" : "bg-slate-950"}`}>
        {/* Always render provider, it will handle client-only logic internally */}
        <ProjectProvider>
          {/* Only show sidebar/topbar when not login/admin routes */}
          {!noLayout && <Sidebar />}
          <div className={`flex-1 flex flex-col min-h-screen ${!noLayout ? "md:ml-64" : ""}`}>
            {!noLayout && <Topbar />}
            <main className={`w-full ${noLayout ? "p-0 m-0" : "p-6 lg:p-8"}`}>
              {children}
            </main>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}
