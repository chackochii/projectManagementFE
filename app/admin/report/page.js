"use client";

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
import React, { useEffect, useState } from "react";
import axios from "axios";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399"];

export default function AdminReportsPage() {
  const [contributors, setContributors] = useState([]);
  const [issueStats, setIssueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  // Filters
  const [dateRange, setDateRange] = useState("month"); // today | week | month
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");

  // Data for dropdowns
  const [userList, setUserList] = useState([]);
  const [projectList, setProjectList] = useState([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token") || "";
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchBaseData();
    }
  }, [token]);

  // Load users/projects for filters
  const fetchBaseData = async () => {
    try {
      const usersRes = await axios.get(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectsRes = await axios.get(`${baseUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserList(usersRes.data || []);
      setProjectList(projectsRes.data?.data || []);

      fetchMonthlyReport();
    } catch (error) {
      console.log("Base fetch error", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMonthlyReport();
    }
  }, [dateRange, selectedUser, selectedProject]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${baseUrl}/tasks/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          range: dateRange, // today | week | month
          userId: selectedUser !== "all" ? selectedUser : undefined,
          projectId: selectedProject !== "all" ? selectedProject : undefined,
        },
      });

      const data = res.data;

      setContributors(
        data.employees?.map((e) => ({
          name: e.employee,
          tasks: e.totalTasks,
          hours: e.hoursWorked,
          totalTasks: e.totalTasks,
          todo: e.todo,
          inProgress: e.inProgress,
          review: e.review,
          done: e.done,
        })) || []
      );

      setIssueStats(data.summary || {});
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-white">
        Loading reports...
      </div>
    );
  }

  const pieData = [
    { name: "To Do", value: issueStats?.todo || 0 },
    { name: "In Progress", value: issueStats?.inProgress || 0 },
    { name: "Done", value: issueStats?.done || 0 },
  ];

  return (
    <div className="p-4 md:p-6 text-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Monthly Report</h1>
          <p className="text-slate-400">Analytics for tasks and performance.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Users Filter */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
          >
            <option value="all">All Employees</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm"
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

      {/* --- REST OF YOUR CHARTS BELOW (UNCHANGED) --- */}


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributor Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">Employee Performance</h2>
          <p className="text-slate-400 text-sm mb-6">
            Tickets and total working hours (this month).
          </p>

          <div className="w-full h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributors}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />

                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value, name) =>
                    name === "hours" ? `${value} hrs` : value
                  }
                />

                <Legend />

                {/* Tasks bar */}
                <Bar dataKey="tasks" name="Tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />

                {/* Hours worked bar */}
                <Bar dataKey="hours" name="Hours Worked" fill="#82ca9d" radius={[5, 5, 0, 0]} />

          
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">Task Distribution</h2>
          <p className="text-slate-400 text-sm mb-6">
            Total tasks by status (this month).
          </p>

          <div className="w-full h-72 md:h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={32}
                  wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>




        {/* Employee Task Breakdown */}
{/* Employee Task Breakdown */}
<div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mt-8">
  <h2 className="text-xl font-semibold mb-4">Employee Task Breakdown</h2>

  {contributors.map((emp) => (
    <div key={emp.name} className="mb-8">
      <h3 className="text-lg font-semibold text-blue-300 mb-2">
        {emp.name} — {emp.hours} hrs total
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
            <td className="p-2 text-green-400 font-semibold">{emp.hours}</td>
          </tr>
        </tbody>
      </table>
    </div>
  ))}
</div>



      </div>
    </div>
  );
}
