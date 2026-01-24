"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "../components/adminSideBar";
import AdminTopbar from "../components/adminTopbar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  /**
   * Routes where sidebar & topbar should be hidden
   * (extend this array if needed)
   */
  const AUTH_ROUTES = ["/admin/adminLogin"];

  const isAuthPage = AUTH_ROUTES.includes(pathname);

  return (
    <div className="min-h-screen text-white bg-slate-900">
      {/* ===== DASHBOARD LAYOUT ===== */}
      {!isAuthPage && <AdminSidebar />}

      <div
        className={`flex flex-col min-h-screen transition-all ${
          !isAuthPage ? "md:ml-64" : ""
        }`}
      >
        {!isAuthPage && <AdminTopbar />}

        <main className={`${isAuthPage ? "p-0" : "p-6 mt-16"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
