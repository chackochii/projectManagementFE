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
import { base } from "framer-motion/client";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399"];

export default function ReportsPage() {
  const [contributorData, setContributorData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("employeeUser"));
const username = user?.name; 

const fetchReport = async () => {
  try {
    const token = localStorage.getItem("employeeToken");
    const user = JSON.parse(localStorage.getItem("employeeUser")); 
    const username = user?.name;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const res = await axios.get(`${baseUrl}/tasks/monthly`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const report = res.data;

    /* -----------------------------
       BAR CHART — FILTER USER ONLY
    ------------------------------*/
    const employees = report.employees || [];
    const userOnly = employees.filter((e) => e.employee === username);

    const contributor = userOnly.map((e) => ({
      name: e.employee,
      tasks: e.totalTasks,
      hours: e.hoursWorked,
    }));

    setContributorData(contributor);

    /* ---------------------------------------
       PIE CHART — USE GLOBAL SUMMARY (ALL)
    ----------------------------------------*/
    const summary = report.summary || {};

    const issues = [
      { name: "To Do", value: summary.todo || 0 },
      { name: "In Progress", value: summary.inProgress || 0 },
      { name: "Done", value: summary.done || 0 },
    ];

    setIssueData(issues);

  } catch (err) {
    console.error("Failed to fetch report:", err);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-xl text-slate-300">
        Loading monthly report...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monthly Reports</h1>
        <p className="text-slate-400">
          Analyze project progress and team performance.
        </p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contributor Progress (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">Contributor Progress</h2>
          <p className="text-slate-400 text-sm mb-6">
            Tasks completed by team members.
          </p>

          <div className="w-full h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributorData}>
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
                />
                <Bar dataKey="tasks" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Distribution (Pie Chart) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-1">Issue Distribution</h2>
          <p className="text-slate-400 text-sm mb-6">
            Overview of issue status in the project.
          </p>

          <div className="w-full h-72 md:h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelStyle={{ fontSize: 12, fill: "#cbd5e1" }}
                >
                  {issueData.map((entry, index) => (
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
      </div>
    </div>
  );
}
