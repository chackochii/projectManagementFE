"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

export default function EmployeeLeavePage() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // Load token safely (build-safe)
  useEffect(() => {
    const storedToken = window.localStorage.getItem("employeeToken");
    setToken(storedToken);
  }, []);

  // Fetch leaves only after token is available
  const fetchLeaves = async () => {
    try {
      if (!token) return; // Prevent request before token exists

      const userId = 1; // Replace with actual dynamic userId

      const res = await axios.get(`${baseUrl}/leaves/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const leaves = res.data.leaves.map((leave) => ({
        id: leave.id,
        type: leave.leaveType,
        from: leave.startDate,
        to: leave.endDate,
        reason: leave.reason,
        status: leave.status,
      }));

      setRequests(leaves);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      toast.error("Failed to fetch leave requests");
    }
  };

  useEffect(() => {
    if (token) fetchLeaves();
  }, [token]); // Fetch only when token is ready

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        toast.error("User not authenticated");
        setLoading(false);
        return;
      }

      const payload = {
        type: form.type,
        startDate: form.from,
        endDate: form.to,
        reason: form.reason,
      };

      const res = await axios.post(`${baseUrl}/leaves/request`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newLeave = {
        id: res.data.leave.id,
        type: res.data.leave.leaveType,
        from: res.data.leave.startDate,
        to: res.data.leave.endDate,
        reason: res.data.leave.reason,
        status: res.data.leave.status,
      };

      setRequests((prev) => [newLeave, ...prev]);
      setForm({ type: "Sick Leave", from: "", to: "", reason: "" });
      toast.success("Leave request submitted!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Leave Management</h1>
        <p className="text-slate-400">
          Request leave and view your old leave records.
        </p>
      </div>

      {/* Leave Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl"
      >
        <h2 className="text-xl font-semibold mb-4">Request New Leave</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm mb-1">Leave Type</label>
            <select
              className="bg-slate-800 p-2 rounded-lg border border-slate-700"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Emergency Leave</option>
              <option>Work From Home</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm mb-1">From</label>
            <input
              type="date"
              className="bg-slate-800 p-2 rounded-lg border border-slate-700"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm mb-1">To</label>
            <input
              type="date"
              className="bg-slate-800 p-2 rounded-lg border border-slate-700"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-sm mb-1">Reason</label>
            <textarea
              className="bg-slate-800 p-2 rounded-lg border border-slate-700"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Why do you need leave?"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg font-semibold"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Leave History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl"
      >
        <h2 className="text-xl font-semibold mb-4">Your Leave Requests</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800">
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Reason</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((leave) => (
                <tr
                  key={leave.id}
                  className="border-t border-slate-700 hover:bg-slate-800 transition"
                >
                  <td className="p-2">{leave.type}</td>
                  <td className="p-2">{leave.from}</td>
                  <td className="p-2">{leave.to}</td>
                  <td className="p-2">{leave.reason}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        leave.status === "Approved"
                          ? "bg-green-600/20 text-green-400"
                          : leave.status === "Rejected"
                          ? "bg-red-600/20 text-red-400"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
