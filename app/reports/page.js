"use client";

import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [range, setRange] = useState("month"); // Filter: today, week, month

  // Load auth data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("employeeToken") || "";
      const user = JSON.parse(localStorage.getItem("employeeUser") || "{}");
      setToken(storedToken);
      setUsername(user?.name || "");
    }
  }, []);

  // Fetch report data
  useEffect(() => {
    if (!token || !username) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const res = await axios.get(
          `${baseUrl}/tasks/monthly?range=${range}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const report = res.data;

        // BAR CHART — Current user
        const employees = report.employees || [];
        const userOnly = employees.filter((e) => e.employee === username);

        setContributorData(
          userOnly.map((e) => ({
            name: e.employee,
            totalTasks: e.totalTasks,
            hoursWorked: e.hoursWorked,
          }))
        );

        // PIE CHART — Global summary
        const summary = report.summary || {};
        setIssueData([
          { name: "To Do", value: summary.todo || 0 },
          { name: "In Progress", value: summary.inProgress || 0 },
          { name: "Done", value: summary.done || 0 },
        ]);
      } catch (err) {
        console.error("Failed to fetch report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token, username, range]);

  if (loading) {
    return (
      <div className="p-6 text-center text-xl text-slate-300">
        Loading report...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-slate-400">
            Analyze project progress and performance
          </p>
        </div>

        {/* Filter */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">
            Contributor Progress
          </h2>
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
                  formatter={(value, name) => [
                    value,
                    name === "totalTasks" ? "Total Tasks" : "Hours Worked",
                  ]}
                />
                <Bar dataKey="totalTasks" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hoursWorked" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
       {/* Pie Chart */}
<div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
  <h2 className="text-xl font-semibold mb-1">
    Issue Distribution
  </h2>

  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          // Filter out zero-value slices
          data={issueData.filter((item) => item.value > 0)}
          cx="50%"
          cy="50%"
          outerRadius="70%"
          dataKey="value"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {issueData
            .filter((item) => item.value > 0)
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
    </div>
  );
}
