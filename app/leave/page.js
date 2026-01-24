"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

export default function EmployeeLeavePage() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // ---------------- LOAD USER + TOKEN ----------------
  useEffect(() => {
    const storedUser = localStorage.getItem("employeeUser");
    const storedToken = localStorage.getItem("employeeToken");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // ---------------- FETCH LEAVES ----------------
  const fetchLeaves = useCallback(async () => {
    if (!token || !user?.id) return;

    try {
      const res = await axios.get(
        `${baseUrl}/leaves/user/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests(
        res.data.leaves.map((leave) => ({
          id: leave.id,
          type: leave.leaveType,
          from: leave.startDate,
          to: leave.endDate,
          reason: leave.reason,
          status: leave.status,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch leave requests");
    }
  }, [token, user, baseUrl]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // ---------------- SUBMIT LEAVE ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.from || !form.to) {
      toast.error("Please select leave dates");
      return;
    }

    if (new Date(form.from) > new Date(form.to)) {
      toast.error("From date cannot be after To date");
      return;
    }

    if (!token || !user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        type: form.type,
        startDate: form.from,
        endDate: form.to,
        reason: form.reason,
      };

      const res = await axios.post(
        `${baseUrl}/leaves/request`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  // ---------------- UI ----------------
  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Leave Management</h1>
        <p className="text-slate-400">
          Request leave and view your previous leave records.
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
          <div>
            <label className="text-sm mb-1">Leave Type</label>
            <select
              className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Emergency Leave</option>
              <option>Work From Home</option>
            </select>
          </div>

          <div>
            <label className="text-sm mb-1">From</label>
            <input
              type="date"
              className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm mb-1">To</label>
            <input
              type="date"
              className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm mb-1">Reason</label>
            <textarea
              className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
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
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
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
                  className="border-t border-slate-700 hover:bg-slate-800"
                >
                  <td className="p-2">{leave.type}</td>
                  <td className="p-2">{leave.from}</td>
                  <td className="p-2">{leave.to}</td>
                  <td className="p-2">{leave.reason}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
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
