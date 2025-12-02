"use client";

import Link from "next/link";
import axios from "axios";
import { useState, useEffect } from "react";
import { toast,Toaster } from "react-hot-toast";

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

export default function AdminDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 🔥 FORM DATA
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    status: "active",
  });

  // 🔥 REPORT DATA (from API)
  const [contributors, setContributors] = useState([]);
  const [issueStats, setIssueStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });

  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#a78bfa"];

  // Handle Input
  const updateField = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🔥 Create Project with Bearer Token
  const createProject = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(`${baseUrl}/projects/`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Project created successfully!");
      setShowModal(false);

      setForm({
        name: "",
        description: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        status: "active",
      });
    } catch (err) {
      console.error(err);
      toast.error("Error creating project");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FETCH MONTHLY REPORT
  const fetchMonthlyReport = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${baseUrl}/tasks/monthly`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;

      // Formatting contributors for bar chart
      setContributors(
        data.employees?.map((e) => ({
          name: e.employee,
          tasks: e.totalTasks,
          hours: e.hoursWorked,
          todo: e.todo,
          inProgress: e.inProgress,
          review: e.review,
          done: e.done,
        })) || []
      );

      setIssueStats(data.summary || {});
    } catch (err) {
      console.error("Report fetch error:", err);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-400">Overview of projects, tasks, and team activity.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2 rounded-xl font-medium"
        >
          + Add New Project
        </button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Cards */}
        <div className="col-span-1 lg:col-span-1 space-y-6">

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
            <div className="space-y-3 text-slate-300 p-3">
              <p>• Total Tasks: {issueStats.total}</p>
              {/* <p>• Hours Worked: {issueStats.totalHours}</p> */}
              <p>• To Do: {issueStats.todo}</p>
              <p>• In Progress: {issueStats.inProgress}</p>
              <p>• Review: {issueStats.review}</p>
              <p>• Done: {issueStats.done}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4">Current Date & Time</h2>
            <p className="text-slate-300 text-lg p-3">{new Date().toLocaleDateString()}</p>
            <p className="text-slate-300 text-lg p-3">{new Date().toLocaleTimeString()}</p>
          </div>

        </div>

        {/* Right section (Charts) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">

          {/* Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-1">Contributor Progress</h2>
            <p className="text-slate-400 text-sm mb-6">Tasks completed by contributors.</p>

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
                  />

                  <Bar dataKey="tasks" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-1">Task Distribution</h2>
            <p className="text-slate-400 text-sm mb-6">Status breakdown of all tasks.</p>

            <div className="w-full h-72 md:h-80 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "To Do", value: issueStats.todo },
                      { name: "In Progress", value: issueStats.inProgress },
                      { name: "Review", value: issueStats.review },
                      { name: "Done", value: issueStats.done },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>

                  <Legend verticalAlign="bottom" wrapperStyle={{ color: "#cbd5e1" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>
      </div>

      {/* 🔥 Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-[90%] md:w-[450px] border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Create Project</h2>

            <label className="text-slate-300 text-sm">Project Name</label>
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-3"
            />

            <label className="text-slate-300 text-sm">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-3"
            />

            <label className="text-slate-300 text-sm">Client Name</label>
            <input
              name="clientName"
              value={form.clientName}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-3"
            />

            <label className="text-slate-300 text-sm">Client Email</label>
            <input
              name="clientEmail"
              value={form.clientEmail}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-3"
            />

            <label className="text-slate-300 text-sm">Client Phone</label>
            <input
              name="clientPhone"
              value={form.clientPhone}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-3"
            />

            <label className="text-slate-300 text-sm">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 mb-5"
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
