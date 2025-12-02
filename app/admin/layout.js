"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "../components/adminSideBar";
import AdminTopbar from "../components/adminTopbar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // Correct route detection
  const isAdminLogin = pathname === "/admin/adminLogin";

  return (
    <div
      className={`min-h-screen text-white ${
        isAdminLogin ? "" : "flex bg-slate-900"
      }`}
    >
      {/* Sidebar - hidden on admin login */}
      {!isAdminLogin && <AdminSidebar />}

      {/* Main Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen ${
          isAdminLogin ? "" : "md:ml-64"
        }`}
      >
        {/* Topbar - hidden on admin login */}
        {!isAdminLogin && <AdminTopbar />}

        {/* Page content */}
        <main className={`${isAdminLogin ? "p-0 m-0" : "p-6 mt-16"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
