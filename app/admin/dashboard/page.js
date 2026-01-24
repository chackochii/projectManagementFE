"use client";

import axios from "axios";
import { useState, useEffect, useCallback, useMemo } from "react";
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

export default function AdminDashboard() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /* ---------------- STATE ---------------- */
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    status: "active",
  });

  const [contributors, setContributors] = useState([]);
  const [issueStats, setIssueStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    total: 0,
  });

  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#a78bfa"];

  /* ---------------- TOKEN LOAD (CLIENT ONLY) ---------------- */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  /* ---------------- CLIENT TIME (SSR SAFE) ---------------- */
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());

    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- FORM HANDLER ---------------- */
  const updateField = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  /* ---------------- CREATE PROJECT ---------------- */
  const createProject = useCallback(async () => {
    if (!token) {
      toast.error("Authentication missing");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${baseUrl}/projects`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Project created successfully");
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
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl, form]);

  /* ---------------- MONTHLY REPORT ---------------- */
  const fetchMonthlyReport = useCallback(async () => {
    if (!token) return;

    try {
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
    }
  }, [token, baseUrl]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

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

  /* ---------------- UI ---------------- */
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

        {/* <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl"
        >
          + Add New Project
        </button> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUMMARY */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-4">Report Summary</h2>
            <div className="space-y-2 text-slate-300">
              <p>Total Tasks: {issueStats.total}</p>
              <p>To Do: {issueStats.todo}</p>
              <p>In Progress: {issueStats.inProgress}</p>
              <p>Review: {issueStats.review}</p>
              <p>Done: {issueStats.done}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-3">Current Time</h2>
            <p className="text-slate-300">
              {currentTime ?? "Loading..."}
            </p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-4">
              Contributor Progress
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributors}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-semibold mb-4">
              Task Distribution
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    dataKey="value"
                  >
                    {COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      {/* {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Create Project</h2>

            {Object.keys(form).map(
              (field) =>
                field !== "status" && (
                  <input
                    key={field}
                    name={field}
                    placeholder={field}
                    value={form[field]}
                    onChange={updateField}
                    className="w-full mb-3 p-2 bg-slate-800 border border-slate-700 rounded"
                  />
                )
            )}

            <select
              name="status"
              value={form.status}
              onChange={updateField}
              className="w-full mb-4 p-2 bg-slate-800 border border-slate-700 rounded"
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={loading}
                className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
