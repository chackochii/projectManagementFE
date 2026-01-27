"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function ReportsPage() {
  const [contributorData, setContributorData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [range, setRange] = useState("month");

  // ----------------- LOAD AUTH -----------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("employeeToken") || "";
      const user = JSON.parse(localStorage.getItem("employeeUser") || "{}");

      setToken(storedToken);
      setUsername(user?.name || "");
      setUserId(user?.id || "");
    }
  }, []);

  // ----------------- FETCH REPORT -----------------
  const fetchReport = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      const [monthlyRes, taskRes] = await Promise.all([
        axios.get(`${baseUrl}/tasks/monthly?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseUrl}/tasks/user-tasks?userId=${userId}&range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const report = monthlyRes.data;

      const employees = report.employees || [];
      const userOnly = employees.filter((e) => e.employee === username);

      setContributorData(
        userOnly.map((e) => ({
          name: e.employee,
          totalTasks: e.totalTasks,
          hoursWorked: Math.round(e.hoursWorked * 3600),
        }))
      );

      const summary = report.summary || {};
      setIssueData([
        { name: "To Do", value: summary.todo || 0 },
        { name: "In Progress", value: summary.inProgress || 0 },
        { name: "Done", value: summary.done || 0 },
      ]);

      setTasks(taskRes.data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [token, userId, username, range]);

  // ----------------- FETCH ON INIT OR RANGE CHANGE -----------------
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ----------------- HELPERS -----------------
  const formatSecondsToHMS = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // ----------------- LOADING -----------------
  if (loading) {
    return (
      <div className="p-6 text-center text-xl text-slate-300">
        Loading report...
      </div>
    );
  }

  // ----------------- RENDER -----------------
  return (
    <div className="p-6 md:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-slate-400">
            Analyze your task progress and work history
          </p>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BAR CHART */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">Contributor Progress</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your total tasks and hours worked
          </p>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributorData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value, name) =>
                    name === "hoursWorked"
                      ? [formatSecondsToHMS(value), "Hours Worked"]
                      : [value, "Total Tasks"]
                  }
                />
                <Bar dataKey="totalTasks" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hoursWorked" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-4">Issue Distribution</h2>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueData.filter((i) => i.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {issueData
                    .filter((i) => i.value > 0)
                    .map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TASKS WORKED */}
      <div className="mt-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-4">Tasks Worked</h2>

        {tasks.length === 0 && (
          <p className="text-slate-400 text-sm">
            No completed tasks for this period.
          </p>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <h4 className="font-medium">{task.title}</h4>
                <p className="text-sm text-slate-400">
                  {task.project || "No Project"} • {formatDate(task.completedAt)}
                </p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="px-2 py-1 rounded bg-emerald-900 text-emerald-300">
                  {task.status.toUpperCase()}
                </span>
                <span className="text-slate-300">
                  {formatSecondsToHMS(task.hoursWorked * 3600)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
