"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function ProjectUserTimeReport() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // ---------------- AUTH ----------------
  useEffect(() => {
    const storedToken = localStorage.getItem("employeeToken");
    const storedUser = localStorage.getItem("employeeUser");

    setToken(storedToken);

    if (storedUser) {
      const user = JSON.parse(storedUser);
      fetchProjectsForUser(user.id, storedToken);
    }

    fetchUsers(storedToken);
  }, []);

  const getAuthHeaders = (customToken) => {
    const t = customToken || token;
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {};
  };

  // ---------------- FETCH PROJECTS ----------------
  const fetchProjectsForUser = async (userId, customToken) => {
    if (!userId) {
      setProjects([]);
      return;
    }

    try {
      const res = await axios.get(
        `${baseUrl}/project-members/user/${userId}/projects`,
        {
          ...getAuthHeaders(customToken),
          timeout: 10000,
        }
      );

      setProjects(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    }
  };

  // ---------------- FETCH USERS ----------------
  const fetchUsers = async (customToken) => {
    try {
      const res = await axios.get(
        `${baseUrl}/users`,
        getAuthHeaders(customToken)
      );

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data;

      setUsers(list || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  // ---------------- FETCH REPORT ----------------
  const fetchReport = async () => {
    if (!selectedProject || !token) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${baseUrl}/task-time/${selectedProject}`,
        {
          ...getAuthHeaders(),
          params: {
            userId: selectedUser || undefined,
            range: dateRange,
          },
          timeout: 10000,
        }
      );

      setReportData(res.data?.tasks || []);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };


  const formatHoursToHMS = (hours = 0) => {
  const totalSeconds = Math.round(hours * 3600);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};


  // Refetch on filter change
  useEffect(() => {
    fetchReport();
  }, [selectedProject, selectedUser, dateRange, token]);

  // ---------------- UI ----------------
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">
        Project Task Time Report
      </h1>

      {/* FILTERS */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Project */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* REPORT */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-6 rounded-xl border border-slate-800"
      >
        {loading ? (
          <p className="text-slate-400">Loading report...</p>
        ) : reportData.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No data found for selected period.
          </p>
        ) : (
          <>
            {/* TABLE (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="p-3 text-left">Task ID</th>
                    <th className="p-3 text-left">Task Name</th>
                    <th className="p-3 text-left">Hours Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row) => (
                    <tr
                      key={row.taskId}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="p-3">{row.taskId}</td>
                      <td className="p-3">{row.taskName}</td>
                      <td className="p-3 font-semibold">
                          {formatHoursToHMS(row.hoursTaken)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-4">
              {reportData.map((row) => (
                <div
                  key={row.taskId}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold">
                    {row.taskName}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Task ID: {row.taskId}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="text-slate-500">
                      Hours Taken:
                    </span>{" "}
                    <strong>{formatHoursToHMS(row.hoursTaken)}</strong>
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
