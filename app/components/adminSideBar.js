"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  FiUsers, FiCalendar, FiHome, FiMenu, FiFile, 
  FiDisc, FiLogOut, FiUserCheck, FiBox, FiClipboard, FiTablet,
  FiFileText, FiLayers
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: FiHome },
  { label: "Employees", href: "/admin/employees", icon: FiUsers },
  { label: "Reports", href: "/admin/report", icon: FiDisc },
  { label: "Leave Management", href: "/admin/leaves", icon: FiCalendar },
  { label: "Projects", href: "/admin/projects", icon: FiFile },
  { label: "Clients", href: "/admin/clients", icon: FiUserCheck },
  { label: "Task Management", href: "/admin/empolyeeTask", icon: FiBox },
  { label: "Invoice", href: "/admin/dummy", icon: FiFileText },
  // { label: "Accounting", href: "/admin/accounting", icon: FiClipboard }, 
  { label: "CostEstimate", href: "/admin/costEstimate", icon: FiLayers },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-950 px-4 py-3 flex justify-between items-center z-50 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} aria-label="Open Menu">
            <FiMenu size={22} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              T
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-semibold tracking-wide text-sm">TSUITE</span>
              <span className="text-[10px] text-slate-400 -mt-0.5">Admin</span>
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 md:top-0 left-0 
          h-[calc(100%-56px)] md:h-full 
          w-64 bg-slate-950 border-r border-slate-800 z-40 
          transform transition-transform duration-300 
          ${open ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
        `}
      >
        <div className="hidden md:flex p-6 border-b border-slate-800 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
            T
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">TSUITE</h2>
            <p className="text-xs text-slate-400 -mt-1">Admin Panel</p>
          </div>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-80px)]">
          <nav className="p-4 flex flex-col gap-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive 
                      ? "bg-indigo-600 text-white" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => {
              localStorage.clear();
              router.replace("/admin/adminLogin");
              setOpen(false);
            }}
            className="m-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Dark overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 md:hidden z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
