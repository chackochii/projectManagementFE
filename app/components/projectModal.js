"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ project, closeModal }) {
  if (!project) return null;

  // ESC key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]);

  const statusStyles = {
    active: "bg-green-500/20 text-green-400",
    completed: "bg-blue-500/20 text-blue-400",
    "on-hold": "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative focus:outline-none"
        tabIndex={-1}
      >
        {/* Close */}
        <button
          onClick={closeModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Project Title */}
        <h2 className="text-2xl font-semibold mb-4 text-white">
          {project.name}
        </h2>

        {/* Status */}
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm ${
            statusStyles[project.status] ||
            "bg-slate-700 text-slate-300"
          }`}
        >
          {project.status || "unknown"}
        </span>

        {/* Created Date */}
        <p className="text-slate-400 text-sm mt-3">
          Created:{" "}
          {new Date(project.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {/* Description */}
        <p className="text-slate-300 mt-6 leading-relaxed">
          {project.description || "No description available."}
        </p>

        {/* Client Details */}
        <div className="mt-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">
            Client Details
          </h3>

          <div className="space-y-2 text-slate-300">
            <p>
              <span className="font-medium text-slate-400">Client Name:</span>{" "}
              {project.clientName || "—"}
            </p>
            <p>
              <span className="font-medium text-slate-400">Email:</span>{" "}
              {project.clientEmail || "—"}
            </p>
            <p>
              <span className="font-medium text-slate-400">Phone:</span>{" "}
              {project.clientPhone || "—"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
