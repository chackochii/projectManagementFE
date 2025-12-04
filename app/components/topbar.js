"use client";
import { FiSearch, FiPlus } from "react-icons/fi";
import { useState, useEffect } from "react";

export default function Topbar() {
  const [user, setUser] = useState(null);

  const username = user?.name;

  useEffect(() => {
    const saved = localStorage.getItem("employeeUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4">
      {/* ---------- TOP ROW (Always visible on all screens) ---------- */}
      <div className="flex items-center justify-between md:justify-start gap-4">
        {/* Desktop Search (hidden on mobile) */}
        <div className="hidden md:block flex-1 max-w-3xl mx-auto">
          <div className="relative">
            <input
              placeholder="Search..."
              className="w-full bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none"
            />
            <FiSearch className="absolute top-2.5 right-3 text-slate-400" />
          </div>
        </div>

        {/* Desktop Create Button + Avatar (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold uppercase">
              {username
                ?.split(" ")
                ?.map((word) => word[0])
                ?.join("")
                ?.slice(0, 2) || ""}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
