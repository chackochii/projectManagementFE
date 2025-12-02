"use client";

import { useState } from "react";
import axios from "axios";

export default function CreateTaskModal({ onClose, refresh }) {
  const [task, setTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeId: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  const handleCreate = async () => {
    try {
      await axios.post(
        `${baseUrl}/tasks`,
        {
          ...task,
          reporterId: 1, // you can replace this with logged in user
          status: "backlog",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Create Task</h2>

        <input
          type="text"
          placeholder="Title"
          className="w-full mb-3 border p-2 rounded"
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="w-full mb-3 border p-2 rounded"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
        ></textarea>

        <select
          className="w-full mb-3 border p-2 rounded"
          value={task.priority}
          onChange={(e) => setTask({ ...task, priority: e.target.value })}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button
          onClick={handleCreate}
          className="w-full bg-blue-600 text-white p-2 rounded mb-2"
        >
          Create
        </button>

        <button onClick={onClose} className="w-full bg-gray-300 p-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}
