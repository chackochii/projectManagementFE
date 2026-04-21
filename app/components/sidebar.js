"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiGrid,
  FiList,
  FiBarChart2,
  FiUser,
  FiMenu,
  FiChevronDown,
  FiBook,
  FiLogOut,
  FiFile,
  FiFlag,
  FiBox,
  FiAlertTriangle // Ensure this is here!
} from "react-icons/fi";

import { useProject } from "../context/ProjectContext";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { projects, currentProject, setCurrentProject, loading } = useProject();

  const [open, setOpen] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("employeeUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!open) setShowProjects(false);
  }, [open]);

  const username = user?.name ?? "";
  const role = user?.role ?? "";

  // ---------------- Navigation ----------------
  const nav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: <FiHome /> },
      { href: "/board", label: "Board", icon: <FiGrid /> },
      { href: "/backlog", label: "Backlog", icon: <FiList /> },
      { href: "/reports", label: "My Reports", icon: <FiBarChart2 /> },
      { href: "/leave", label: "Leave Management", icon: <FiUser /> },
      { href: "/activeTickets", label: "Active Tickets", icon: <FiBook /> },

      ...(role === "project_manager"
        ? [{ href: "/projects", label: "Project Management", icon: <FiFile /> }]
        : []),

      ...(role === "project_manager"
        ? [{ href: "/dummy", label: "Micro Management", icon: <FiFlag /> }]
        : []),

      ...(role === "project_manager"
        ? [{ href: "/empolyeeTask", label: "Task Management", icon: <FiBox /> }]
        : []),
    ],
    [role]
  );

  const handleNavClick = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear(); // Clears all at once safely
    router.replace("/login");
  };

  const initials = username
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800" />
    );
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-3 border-b border-slate-800">
        <button onClick={() => setOpen(true)} className="text-slate-200">
          <FiMenu size={20} />
        </button>

        <div className="text-slate-200 font-semibold truncate">
          {loading ? "Loading..." : currentProject?.name || "No Projects"}
        </div>

        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold uppercase text-sm">
          {initials}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5 h-full flex flex-col justify-between">

          {/* Top Section */}
          <div>

            {/* TSUITE Compact Brand */}
            <div className="mb-6 flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-sm shadow">
                T
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-semibold text-sm tracking-wide">
                  TSUITE
                </span>
                <span className="text-[10px] text-slate-400">
                  Workspace
                </span>
              </div>
            </div>

            {/* Project Switcher */}
            <div className="mb-6">
              <button
                onClick={() => setShowProjects((v) => !v)}
                className="flex items-center justify-between w-full bg-slate-800 px-3 py-2 rounded-lg text-white text"
              >
                <span className="truncate">
                  {loading
                    ? "Loading..."
                    : currentProject?.name || "Select Project"}
                </span>
                <FiChevronDown
                  className={`transition-transform ${
                    showProjects ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProjects && !loading && projects.length > 0 && (
                <div className="mt-2 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  {projects
                    .filter((p) => p && p.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentProject(p);
                          localStorage.setItem(
                            "currentProject",
                            JSON.stringify(p)
                          );
                          setShowProjects(false);
                          if (window.innerWidth < 768) setOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          currentProject?.id === p.id
                            ? "bg-slate-700 text-white"
                            : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              {nav.map((n) => {
                const active = pathname === n.href;

                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm
                      ${
                        active
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <span className="text-base">{n.icon}</span>
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </nav>

          </div>

          {/* Bottom Section */}
          <div>

            {/* User Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold uppercase text-sm">
                {initials}
              </div>

              <div className="text-sm">
                <div className="text-slate-200 truncate max-w-[140px]">
                  {username}
                </div>
                <div className="text-slate-400 text-xs truncate max-w-[140px]">
                  {role}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
               onClick={() => setIsLogoutModalOpen(true)} 
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition text-sm"
            >
              <FiLogOut size={16} />
              Logout
            </button>

          </div>

        </div>
      </aside>

  {/* 3. LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-slate-900 border border-slate-800 w-[280px] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
                <FiAlertTriangle size={20} />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1">
                Confirm Logout
              </h3>
              <p className="text-slate-400 text-xs mb-5 px-2 leading-relaxed">
                Are you sure you want to log out of your workspace?
              </p>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-xs font-medium shadow-lg shadow-red-600/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
