"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399"];

export default function AdminReportsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState("month");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");

  // Data
  const [rawContributors, setRawContributors] = useState([]);
  const [issueStats, setIssueStats] = useState(null);
  const [userList, setUserList] = useState([]);
  const [projectList, setProjectList] = useState([]);

  const mountedRef = useRef(true);
  const isFetchingRef = useRef(false); // Fix: Prevent simultaneous fetch requests

  /* ===================== MOUNT ===================== */
  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ===================== API INSTANCE ===================== */
  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: baseUrl,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token, baseUrl]);

  /* ===================== FORMATTERS ===================== */
  const formatHoursToHHMMSS = useCallback((hoursDecimal) => {
    if (!hoursDecimal) return "00:00:00";
    const totalSeconds = Math.floor(hoursDecimal * 3600);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, []);

  /* ===================== BASE DATA ===================== */
  const fetchBaseData = useCallback(async () => {
    if (!api) return;

    try {
      const [usersRes, projectsRes] = await Promise.all([
        api.get("/users"),
        api.get("/projects"),
      ]);

      if (!mountedRef.current) return;

      setUserList(usersRes.data || []);
      setProjectList(projectsRes.data?.data || []);
    } catch (err) {
      console.error("Base data error:", err);
    }
  }, [api]);

  /* ===================== REPORT ===================== */
  const fetchReport = useCallback(async () => {
    if (!api || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const res = await api.get("/tasks/monthly", {
        params: {
          range: dateRange,
          userId: selectedUser !== "all" ? selectedUser : undefined,
          projectId: selectedProject !== "all" ? selectedProject : undefined,
        },
      });

      if (!mountedRef.current) return;

      const data = res.data;

      setRawContributors(data.employees || []);
      setIssueStats({
        todo: Number(data.summary?.todo) || 0,
        inProgress: Number(data.summary?.inProgress) || 0,
        done: Number(data.summary?.done) || 0,
      });
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }
  }, [api, dateRange, selectedUser, selectedProject]);

  /* ===================== EFFECT FLOW ===================== */
  useEffect(() => {
    if (api) fetchBaseData();
  }, [api, fetchBaseData]);

  useEffect(() => {
    if (api) fetchReport();
  }, [api, fetchReport]);

  /* ===================== MEMOIZED DATA ===================== */
  const contributors = useMemo(
    () =>
      rawContributors.map((e) => ({
        name: e.employee,
        tasks: Number(e.totalTasks) || 0,
        hours: Number(e.hoursWorked) || 0,
        totalTasks: Number(e.totalTasks) || 0,
        todo: Number(e.todo) || 0,
        inProgress: Number(e.inProgress) || 0,
        review: Number(e.review) || 0,
        done: Number(e.done) || 0,
      })),
    [rawContributors]
  );

  const pieData = useMemo(
    () => [
      { name: "To Do", value: issueStats?.todo || 0 },
      { name: "In Progress", value: issueStats?.inProgress || 0 },
      { name: "Done", value: issueStats?.done || 0 },
    ],
    [issueStats]
  );

  /* ===================== LOADING ===================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Loading reports…
      </div>
    );
  }

  /* ===================== UI ===================== */
  return (
    <div className="p-6 text-white">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Task Reports</h1>
          <p className="text-slate-400">Performance & workload analytics</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Employees</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Projects</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Employee Performance</h2>
          <div className="h-80">
            {/* Fix: width="99%" prevents infinite resize loop causing 100% CPU usage */}
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={contributors}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  formatter={(v, n) =>
                    n === "hours" ? formatHoursToHHMMSS(v) : v
                  }
                />
                <Legend />
                <Bar dataKey="tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Task Distribution</h2>
          <div className="h-80">
            {/* Fix: width="99%" prevents infinite resize loop causing 100% CPU usage */}
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={pieData.filter(d => d.value > 0)} dataKey="value" outerRadius="70%" label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TASK REPORT */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mt-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Employee Task Breakdown</h2>

        {contributors.map((emp) => (
          <div key={emp.name} className="mb-8">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              {emp.name} — {formatHoursToHHMMSS(emp.hours)} total
            </h3>

            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="p-2">Metric</th>
                  <th className="p-2">Value</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="p-2 text-white">To Do</td>
                  <td className="p-2 text-slate-300">{emp.todo}</td>
                </tr>

                <tr className="border-b border-slate-800">
                  <td className="p-2 text-white">In Progress</td>
                  <td className="p-2 text-slate-300">{emp.inProgress}</td>
                </tr>

                <tr className="border-b border-slate-800">
                  <td className="p-2 text-white">Review</td>
                  <td className="p-2 text-slate-300">{emp.review}</td>
                </tr>

                <tr className="border-b border-slate-800">
                  <td className="p-2 text-white">Done</td>
                  <td className="p-2 text-slate-300">{emp.done}</td>
                </tr>

                <tr className="border-b border-slate-800">
                  <td className="p-2 text-white">Total Tasks</td>
                  <td className="p-2 text-slate-300">{emp.totalTasks}</td>
                </tr>

                <tr>
                  <td className="p-2 text-white">Hours Worked</td>
                  <td className="p-2 text-green-400 font-semibold">
                    {formatHoursToHHMMSS(emp.hours)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
