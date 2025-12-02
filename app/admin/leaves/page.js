"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const statusColor = {
    Pending: "text-yellow-400 bg-yellow-400/10",
    Approved: "text-green-400 bg-green-400/10",
    Rejected: "text-red-400 bg-red-400/10",
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${baseUrl}/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const leavesData = res.data.leaves.map((leave) => ({
        id: leave.id,
        employee: leave.email,
        role: leave.role || "Developer",
        from: leave.startDate,
        to: leave.endDate,
        type: leave.leaveType,
        status: leave.status,
        email: leave.email,
      }));

      setLeaves(leavesData);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Employee Leave Management</h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg"
      >
        {loading ? (
          <p className="text-slate-400">Loading leaves...</p>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="p-3 text-left">UserName</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">From</th>
                    <th className="p-3 text-left">To</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition"
                    >
                      <td className="p-3">{leave.employee}</td>
                      <td className="p-3 text-slate-400">{leave.role}</td>
                      <td className="p-3">{leave.from}</td>
                      <td className="p-3">{leave.to}</td>
                      <td className="p-3">{leave.type}</td>

                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusColor[leave.status]
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>

                      <td className="p-3 flex gap-3">
                        {leave.status === "Pending" && (
                          <>
                            <button className="text-green-400 hover:underline">
                              Approve
                            </button>
                            <button className="text-red-400 hover:underline">
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{leave.employee}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        statusColor[leave.status]
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-sm">{leave.role}</p>

                  <div className="mt-3 text-sm space-y-1">
                    <p>
                      <span className="text-slate-500">From:</span>{" "}
                      {leave.from}
                    </p>
                    <p>
                      <span className="text-slate-500">To:</span> {leave.to}
                    </p>
                    <p>
                      <span className="text-slate-500">Type:</span>{" "}
                      {leave.type}
                    </p>
                  </div>

                  {/* Buttons */}
                  {leave.status === "Pending" && (
                    <div className="flex gap-3 mt-4">
                      <button className="flex-1 py-2 bg-green-900/40 text-green-400 rounded-lg hover:bg-green-900/60 transition">
                        Approve
                      </button>
                      <button className="flex-1 py-2 bg-red-900/40 text-red-400 rounded-lg hover:bg-red-900/60 transition">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
