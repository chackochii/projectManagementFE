"use client";

import "./globals.css";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { SearchProvider } from "../lib/searchContext";
import { usePathname } from "next/navigation";
import { ProjectProvider } from "./context/ProjectContext";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Routes where layout should be hidden
  const hideLayout = pathname.startsWith("/admin");
  const isLoginPage = ["/login", "/register", "/forgot-password","/"].includes(pathname);
  const noLayout = hideLayout || isLoginPage;

  return (
    <html lang="en">
      <body
        className={`text-white min-h-screen ${
          noLayout ? "" : "bg-slate-950"
        }`}
      >
        <ProjectProvider>
          {/* Sidebar & Topbar Hidden on Login/Admin */}
          {!noLayout && <Sidebar />}

          <div
            className={`flex-1 flex flex-col min-h-screen ${
              !noLayout ? "md:ml-64" : ""
            }`}
          >
            {!noLayout && <Topbar />}

            <main
              className={`w-full ${
                noLayout ? "p-0 m-0" : "p-6 lg:p-8"
              }`}
            >
              {children}
            </main>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}
