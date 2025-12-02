"use client";

import { useState } from "react";
import Link from "next/link";
import { FiUsers, FiCalendar, FiHome, FiMenu, FiX, FiFile, FiDisc } from "react-icons/fi";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <FiHome /> },
    { label: "Employees", href: "/admin/employees", icon: <FiUsers /> },
     { label: "Reports", href: "/admin/report", icon: <FiDisc /> },
     { label: "Leave Management", href: "/admin/leaves", icon: <FiCalendar /> },
      { label: "Projects", href: "/admin/projects", icon: <FiFile /> },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 p-3 flex justify-between items-center z-50 border-b border-slate-800">
        <button onClick={() => setOpen(true)}>
          <FiMenu size={24} className="text-white" />
        </button>
        <p className="font-bold">Admin Panel</p>
        <div className="w-8 h-8 rounded-full bg-slate-700" />
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-slate-950 border-r border-slate-800 z-40 
          transform transition-transform duration-300 
          ${open ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0
        `}
      >
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <FiX size={22} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
            >
              <span className="text-slate-400">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Dark overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 md:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
