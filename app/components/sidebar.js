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

  // ---------------- Effects ----------------
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

  // ---------------- Navigation (MUST be before render) ----------------
  const nav = useMemo(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: <FiHome /> },
      { href: "/board", label: "Board", icon: <FiGrid /> },
      { href: "/backlog", label: "Backlog", icon: <FiList /> },
      { href: "/reports", label: "Reports", icon: <FiBarChart2 /> },
      { href: "/leave", label: "Leave Management", icon: <FiUser /> },
      { href: "/activeTickets", label: "Active Tickets", icon: <FiBook /> },

      ...(role === "project_manager"
        ? [{ href: "/projects", label: "Project Management", icon: <FiFile /> }]
        : []),

      ...(role === "project_manager"
        ? [{ href: "/dummy", label: "Micro Management", icon: <FiFlag /> }]
        : []),
    ],
    [role]
  );

  const handleNavClick = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("employeeUser");
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("currentProjectId");
    localStorage.removeItem("currentProject");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    router.replace("/login");
  };

  const initials = username
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  // ✅ Safe: conditional rendering AFTER hooks
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
        <div className="p-6 h-full flex flex-col justify-between">
          <div>
            {/* Project Switcher */}
            <div className="mb-6">
              <button
                onClick={() => setShowProjects((v) => !v)}
                className="flex items-center justify-between w-full bg-slate-800 px-3 py-2 rounded-lg text-white"
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
                  {projects.map((p) => (
                    <button
                      key={p.id}
                     onClick={() => {
  setCurrentProject(p);

  localStorage.setItem("currentProject", JSON.stringify(p));

  setShowProjects(false);
  if (window.innerWidth < 768) setOpen(false);
}}

                      className={`w-full text-left px-3 py-2 text-sm transition
                        ${
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
            <nav className="flex flex-col gap-2">
              {nav.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 p-3 rounded-lg transition
                      ${
                        active
                          ? "bg-slate-800 text-white"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                  >
                    <span className="text-slate-300">{n.icon}</span>
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Footer */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold uppercase">
                {initials}
              </div>

              <div className="text-sm">
                <div className="text-slate-200">{username}</div>
                <div className="text-slate-400 text-xs">{role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
