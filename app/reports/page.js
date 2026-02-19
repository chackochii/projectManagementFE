"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useProject } from "../context/ProjectContext.js";

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

const COLORS = ["#60a5fa", "#fbbf24", "#a78bfa", "#34d399"];

export default function ReportsPage() {
  const { currentProject } = useProject();

  const [contributorData, setContributorData] = useState([]);
  const [issueData, setIssueData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [range, setRange] = useState("month");

  const fetchingRef = useRef(false);

  const [filters, setFilters] = useState({
    projectId: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  // ---------------- LOAD AUTH ----------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("employeeToken") || "";
      const userStr = localStorage.getItem("employeeUser");

      if (userStr) {
        const user = JSON.parse(userStr);

        setToken(storedToken);
        setUsername(user.name || "");
        setUserId(user.id || "");

        setFilters((prev) => ({
          ...prev,
          userId: user.id || "",
        }));
      }
    }
  }, []);

  // ---------------- SET PROJECT ----------------
  useEffect(() => {
    if (currentProject?.id) {
      setFilters((prev) => ({
        ...prev,
        projectId: currentProject.id,
      }));
    }
  }, [currentProject]);

  // ---------------- DATE RANGE ----------------
  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();

    if (range === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      start.setDate(end.getDate() - 7);
    } else {
      start.setDate(end.getDate() - 30);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  useEffect(() => {
    const { startDate, endDate } = getDateRange(range);
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, [range]);

  // ---------------- FETCH DATA ----------------
  const fetchReport = useCallback(async () => {
    if (!token || !filters.projectId || !filters.userId || fetchingRef.current)
      return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;

      // 1️⃣ Monthly Report
      const monthlyRes = await axios.get(`${baseUrl}/tasks/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { range },
      });

      const report = monthlyRes.data;

      // Contributor Chart
      const employees = report.employees || [];
      const currentUser = employees.filter(
        (e) => e.employee === username
      );

      setContributorData(
        currentUser.map((e) => ({
          name: e.employee,
          totalTasks: e.totalTasks,
          hoursWorked: Number(e.hoursWorked.toFixed(2)),
        }))
      );

      // Pie Chart
      const summary = report.summary || {};
      setIssueData([
        { name: "To Do", value: summary.todo || 0 },
        { name: "In Progress", value: summary.inProgress || 0 },
        { name: "Review", value: summary.review || 0 },
        { name: "Done", value: summary.done || 0 },
      ]);

      setSummaryData(summary);

      // 2️⃣ Task Details
      const taskRes = await axios.get(
        `${baseUrl}/tasks/tasksDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            projectId: filters.projectId,
            userId: filters.userId,
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }
      );

      setTasks(
        (taskRes.data.tasks || []).map((task) => {
          const totalSeconds = (task.timeLogs || []).reduce(
            (sum, log) => sum + (log.durationSeconds || 0),
            0
          );

          return {
            id: task.id,
            title: task.title,
            project: task.project?.name || "",
            completedAt: task.updatedAt,
            status: task.status,
            secondsWorked: totalSeconds,
          };
        })
      );
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [token, filters, username, range]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ---------------- HELPERS ----------------
  const formatSecondsToHMS = (totalSeconds = 0) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="p-6 text-center text-xl text-slate-300">
        Loading report...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-slate-400">
            Analyze your productivity and task progress
          </p>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">
            Your Contribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contributorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalTasks" name="Tasks" fill="#22c55e" radius={[3, 3, 0, 0]}/>
              <Bar dataKey="hoursWorked" fill="#fbbf24" name="time taken" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">
            Task Status Distribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {issueData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUMMARY */}
      {/* <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold mb-4">
          Overall Summary
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>Total Tasks: {summaryData.total || 0}</div>
          <div>Total Hours: {summaryData.totalHours || 0} hrs</div>
          <div>In Progress: {summaryData.inProgress || 0}</div>
        </div>
      </div> */}

      {/* TASK TABLE */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold mb-4">
          Task History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Title</th>
                <th>Status</th>
                <th>Project</th>
                <th>Date</th>
                <th>Time Worked</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-800"
                >
                  <td className="py-2">{task.title}</td>
                  <td>{task.status}</td>
                  <td>{task.project}</td>
                  <td>{formatDate(task.completedAt)}</td>
                  <td>
                    {formatSecondsToHMS(task.secondsWorked)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
