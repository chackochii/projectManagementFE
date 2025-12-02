"use client";
import { FiSearch, FiPlus } from "react-icons/fi";

export default function Topbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4">

      {/* ---------- TOP ROW (Always visible on all screens) ---------- */}
      <div className="flex items-center justify-between md:justify-start gap-4">

        {/* Project Title */}


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
          {/* <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-md text-white">
            <FiPlus />
            <span>Create Issue</span>
          </button> */}

          <div className="w-9 h-9 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* ---------- MOBILE ONLY SECTION ---------- */}
      {/* <div className="mt-3 flex flex-col gap-3 md:hidden"> */}

        {/* Mobile Search */}
        {/* <div className="relative">
          <input
            placeholder="Search..."
            className="w-full bg-slate-800 border border-slate-800 rounded-lg px-4 py-2 focus:outline-none"
          />
          <FiSearch className="absolute top-2.5 right-3 text-slate-400" />
        </div>

        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md text-white">
          <FiPlus />
          <span>Create Issue</span>
        </button> */}
      {/* </div> */}
    </header>
  );
}
