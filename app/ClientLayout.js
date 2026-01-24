"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import { ProjectProvider } from "./context/ProjectContext";

export default function ClientLayout({
  children,
}) {
  const pathname = usePathname();

  const hideLayout = pathname.startsWith("/admin");
  const isLoginPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);
  const noLayout = hideLayout || isLoginPage;

  return (
    <ProjectProvider>
      {!noLayout && <Sidebar />}

      <div className={`flex-1 flex flex-col min-h-screen ${!noLayout ? "md:ml-64" : ""}`}>
        {!noLayout && <Topbar />}

        <main className={`w-full ${noLayout ? "p-0 m-0" : "p-6 lg:p-8"}`}>
          {children}
        </main>
      </div>
    </ProjectProvider>
  );
}
