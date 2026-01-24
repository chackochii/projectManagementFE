"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";

export default function CreateTaskModal({ onClose, refresh }) {
  const [task, setTask] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // Load auth once
  useEffect(() => {
    const token = localStorage.getItem("employeeToken");
    const user = localStorage.getItem("employeeUser");

    if (token && user) {
      setAuth({
        token,
        user: JSON.parse(user),
      });
    }
  }, []);

  // Stable axios instance
  const api = useMemo(() => {
    if (!auth?.token) return null;

    return axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
  }, [auth, baseUrl]);

  const handleCreate = async () => {
    if (loading) return;

    if (!task.title.trim()) {
      alert("Task title is required");
      return;
    }

    if (!api || !auth?.user?.id) {
      alert("Authentication error");
      return;
    }

    try {
      setLoading(true);

      await api.post("/tasks", {
        ...task,
        reporterId: auth.user.id,
        status: "backlog",
      });

      refresh();
      onClose();
    } catch (err) {
      console.error("Create task failed:", err);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div
        className="bg-white p-6 rounded-lg w-96 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Create Task</h2>

        <input
          type="text"
          placeholder="Title"
          className="w-full mb-3 border p-2 rounded"
          value={task.title}
          onChange={(e) =>
            setTask((t) => ({ ...t, title: e.target.value }))
          }
        />

        <textarea
          placeholder="Description"
          className="w-full mb-3 border p-2 rounded"
          value={task.description}
          onChange={(e) =>
            setTask((t) => ({ ...t, description: e.target.value }))
          }
        />

        <select
          className="w-full mb-4 border p-2 rounded"
          value={task.priority}
          onChange={(e) =>
            setTask((t) => ({ ...t, priority: e.target.value }))
          }
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button
          onClick={handleCreate}
          disabled={loading}
          className={`w-full text-white p-2 rounded mb-2 ${
            loading ? "bg-blue-400" : "bg-blue-600"
          }`}
        >
          {loading ? "Creating..." : "Create"}
        </button>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full bg-gray-300 p-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
