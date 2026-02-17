"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

export default function EmployeeTasksPage() {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  const [filters, setFilters] = useState({
    userId: "",
    projectId: "",
    startDate: "",
    endDate: "",
    status: "", // new filter
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // ---------------- LOAD USER + TOKEN ----------------
  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");

    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // ---------------- FETCH USERS ----------------
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(res.data || []); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    }
  }, [token, baseUrl]);

  // ---------------- FETCH PROJECTS ----------------
  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllProjects(res.data.data || []); 
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch projects");
    }
  }, [token, baseUrl]);

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, [fetchUsers, fetchProjects]);

  // ---------------- FETCH TASKS ----------------
  const fetchTasks = useCallback(async () => {
    if (!token || !filters.projectId) return;

    setLoading(true);
    try {
      let url = `${baseUrl}/tasks/tasksDetails?projectId=${filters.projectId}`;
      if (filters.userId) url += `&userId=${filters.userId}`;
      if (filters.startDate && filters.endDate)
        url += `&startDate=${filters.startDate}&endDate=${filters.endDate}`;
      if (filters.status) url += `&status=${filters.status}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [token, filters, baseUrl]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ---------------- STATUS / PRIORITY COLORS ----------------
  const getStatusColor = (status) => {
    switch (status) {
      case "done":
        return "bg-green-600/20 text-green-400";
      case "in-progress":
        return "bg-blue-600/20 text-blue-400";
      case "todo":
        return "bg-yellow-600/20 text-yellow-400";
      case "review":
        return "bg-purple-600/20 text-purple-400";
      case "backlog":
        return "bg-slate-600/20 text-slate-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-600/20 text-red-400";
      case "medium":
        return "bg-yellow-600/20 text-yellow-400";
      case "low":
        return "bg-green-600/20 text-green-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const resetFilters = () => {
    setFilters({
      userId: "",
      projectId: "",
      startDate: "",
      endDate: "",
      status: "",
    });
  };

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Task Management</h1>
        <p className="text-slate-400">
          View all tasks with filters by user, project, status, and date range.
        </p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        {/* User Filter */}
        <div>
          <label className="text-sm mb-1 block">User</label>
          <select
            className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
            value={filters.userId}
            onChange={(e) =>
              setFilters({ ...filters, userId: e.target.value })
            }
          >
            <option value="">All Users</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
        <div>
          <label className="text-sm mb-1 block">Project</label>
          <select
            className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
            value={filters.projectId}
            onChange={(e) =>
              setFilters({ ...filters, projectId: e.target.value })
            }
          >
            <option value="">Select Project</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm mb-1 block">Status</label>
          <select
            className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">All Status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="text-sm mb-1 block">Start Date</label>
          <input
            type="date"
            className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-sm mb-1 block">End Date</label>
          <input
            type="date"
            className="bg-slate-800 p-2 rounded-lg border border-slate-700 w-full"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
          />
        </div>

        {/* Apply / Reset Buttons */}
        <div className="md:col-span-5 flex justify-end gap-2 mt-2">
          <button
            onClick={fetchTasks}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg font-semibold"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </motion.div>

      {/* Task Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 p-6 rounded-xl overflow-x-auto"
      >
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>

        {loading ? (
          <div className="text-center text-slate-400 py-6">Loading...</div>
        ) : (
          <table className="w-full text-sm table-auto">
            <thead className="bg-slate-800 text-slate-300 sticky top-0">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Assignee</th>
                <th className="p-3 text-left">Reporter</th>
                <th className="p-3 text-left">Project</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Start</th>
                <th className="p-3 text-left">End</th>
                <th className="p-3 text-left">Hours</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-t border-slate-700 hover:bg-slate-800 transition"
                >
                  <td className="p-3 font-semibold text-white">{task.id}</td>
                  <td className="p-3 font-semibold text-white">{task.title}</td>
                  <td className="p-3 text-slate-300">{task.description}</td>
                  <td className="p-3 text-slate-300">{task.assignee?.name || "Unassigned"}</td>
                  <td className="p-3 text-slate-300">{task.reporter?.name || "Unknown"}</td>
                  <td className="p-3 text-slate-300">{task.project?.name || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{task.startTime ? new Date(task.startTime).toLocaleString() : "-"}</td>
                  <td className="p-3 text-slate-300">{task.endTime ? new Date(task.endTime).toLocaleString() : "-"}</td>
                  <td className="p-3 text-slate-300">{task.hoursTaken || 0}</td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-slate-400">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
