"use client";
import { FiBell, FiSearch } from "react-icons/fi";

export default function AdminTopbar() {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-4.5 flex items-center justify-between z-30">
      
      {/* Title */}
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">
        Admin Dashboard
      </h1>

      {/* Right Side */}
      <div className="flex items-center gap-3 sm:gap-5">

        {/* Search Bar */}
        <div className="relative w-28 sm:w-40 md:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-slate-800 text-white pl-9 pr-3 py-1.5 sm:py-2 rounded-lg w-full 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
          />
        </div>

        {/* Bell Icon */}
        <FiBell className="text-slate-300 w-5 h-5 cursor-pointer hover:text-white transition" />

        {/* Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 
            flex items-center justify-center text-white font-semibold text-sm">
  AD
</div>
      </div>
    </header>
  );
}
