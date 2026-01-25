"use client";

import axios from "axios";
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { toast, Toaster } from "react-hot-toast";
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

// --- Fixed Clock Component to prevent Hydration Error ---
const TimeDisplay = memo(() => {
  // Start with null/empty so the Server and Client match on first render
  const [time, setTime] = useState(null);

  useEffect(() => {
    // This only runs on the Client
    setTime(new Date().toLocaleString());

    const interval = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // While time is null (during server render and first client pass), 
  // show a placeholder to avoid text mismatch
  return (
    <p className="text-slate-300">
      {time ? time : "Loading time..."}
    </p>
  );
});
TimeDisplay.displayName = "TimeDisplay";

export default function AdminDashboard() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /* ---------------- STATE ---------------- */
  const [token, setToken] = useState(null);
  const isFetching = useRef(false);

  const [contributors, setContributors] = useState([]);
  const [issueStats, setIssueStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    total: 0,
  });

  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#a78bfa"];

  /* ---------------- TOKEN LOAD ---------------- */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  /* ---------------- MONTHLY REPORT ---------------- */
  const fetchMonthlyReport = useCallback(async () => {
    if (!token || isFetching.current) return;

    try {
      isFetching.current = true;
      const res = await axios.get(`${baseUrl}/tasks/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      const employees = Array.isArray(data.employees) ? data.employees : [];

      setContributors(
        employees.map((e) => ({
          name: e.employee || "Unknown",
          tasks: Number(e.totalTasks) || 0,
          hours: Number(e.hoursWorked) || 0,
        }))
      );

      const summary = data.summary || {};
      const total =
        (summary.todo || 0) +
        (summary.inProgress || 0) +
        (summary.review || 0) +
        (summary.done || 0);

      setIssueStats({
        todo: summary.todo || 0,
        inProgress: summary.inProgress || 0,
        review: summary.review || 0,
        done: summary.done || 0,
        total: summary.total ?? total,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report");
    } finally {
      isFetching.current = false;
    }
  }, [token, baseUrl]);

  useEffect(() => {
    if (token) fetchMonthlyReport();
  }, [token, fetchMonthlyReport]);

  /* ---------------- MEMOIZED CHART DATA ---------------- */
  const pieData = useMemo(
    () => [
      { name: "To Do", value: issueStats.todo },
      { name: "In Progress", value: issueStats.inProgress },
      { name: "Review", value: issueStats.review },
      { name: "Done", value: issueStats.done },
    ],
    [issueStats]
  );

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400">
            Overview of projects, tasks, and team activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUMMARY */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
            <div className="space-y-2 text-slate-300">
              <p>Total Tasks: {issueStats.total}</p>
              <p>To Do: {issueStats.todo}</p>
              <p>In Progress: {issueStats.inProgress}</p>
              <p>Review: {issueStats.review}</p>
              <p>Done: {issueStats.done}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Current Time</h2>
            <TimeDisplay />
          </div>
        </div>

        {/* CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Contributor Progress</h2>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={contributors}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                  />
                  <Bar dataKey="tasks" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Task Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
