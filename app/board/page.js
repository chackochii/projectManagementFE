"use client";

import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "../components/column";
import { Toaster, toast } from "react-hot-toast";
import { useProject } from "../context/ProjectContext";

// =====================
// Fetch with Timeout
// =====================
const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Fetch failed:", err.message);
    return [];
  } finally {
    clearTimeout(id);
  }
};

export default function Board() {
  const { currentProject } = useProject(); // Project from context
  const projectId = currentProject?.id;

  // -------------------
  // State
  // -------------------
  const [token, setToken] = useState("");
  const [allColumns, setAllColumns] = useState([
    { id: "todo", title: "To Do", tasks: [] },
    { id: "in-progress", title: "In Progress", tasks: [] },
    { id: "review", title: "Review", tasks: [] },
    { id: "done", title: "Done", tasks: [] },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // -------------------
  // Load token (client only)
  // -------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("employeeToken");
      if (t) setToken(t);
    }
  }, []);

  // -------------------
  // Filtered Columns
  // -------------------
  const filteredColumns = allColumns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      const matchesTitle = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser =
        selectedUser === "all" || String(task.assigneeId) === String(selectedUser);
      return matchesTitle && matchesUser;
    }),
  }));

  // -------------------
  // Fetch Tasks & Users
  // -------------------
  useEffect(() => {
    if (!projectId || !token) return;

    const fetchData = async () => {
      setLoading(true);

      // Reset columns
      setAllColumns([
        { id: "todo", title: "To Do", tasks: [] },
        { id: "in-progress", title: "In Progress", tasks: [] },
        { id: "review", title: "Review", tasks: [] },
        { id: "done", title: "Done", tasks: [] },
      ]);

      // Fetch tasks by status
      try {
        const statuses = ["todo", "in-progress", "review", "done"];
        const taskResults = await Promise.all(
          statuses.map((status) =>
            fetchWithTimeout(`${baseUrl}/tasks/status/${status}/${projectId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })
          )
        );

        setAllColumns((prev) =>
          prev.map((col, index) => ({
            ...col,
            tasks: Array.isArray(taskResults[index])
              ? taskResults[index].map((task) => ({
                  id: String(task.id),
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  assigneeId: task.assigneeId,
                }))
              : [],
          }))
        );
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Failed to load tasks");
      }

      // Fetch users
      try {
        const usersData = await fetchWithTimeout(`${baseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(usersData)) {
          setUsers(usersData.filter((u) => u.role !== "admin"));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [projectId, token]); // Re-fetch when project changes

  // -------------------
  // Task Actions
  // -------------------
  const startTask = (taskId) =>
    fetchWithTimeout(`${baseUrl}/tasks/start/${taskId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });

  const endTask = (taskId) =>
    fetchWithTimeout(`${baseUrl}/tasks/end/${taskId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });

  const updateStatus = (taskId, status) =>
    fetchWithTimeout(`${baseUrl}/tasks/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });

  // -------------------
  // Drag & Drop
  // -------------------
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;

    const order = ["todo", "in-progress", "review", "done"];
    const sourceIndex = order.indexOf(source.droppableId);
    const destIndex = order.indexOf(destination.droppableId);

    if (destIndex < sourceIndex) {
      toast.error("You can only move tasks forward.");
      return;
    }

    if (destIndex !== sourceIndex + 1) {
      toast.error("Move tasks step-by-step.");
      return;
    }

    // Optimistic UI update
    setAllColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === source.droppableId);
      const destCol = prev.find((c) => c.id === destination.droppableId);

      const sourceTasks = [...sourceCol.tasks];
      const [task] = sourceTasks.splice(source.index, 1);

      const destTasks = [...destCol.tasks];
      destTasks.splice(destination.index, 0, task);

      return prev.map((c) => {
        if (c.id === source.droppableId) return { ...c, tasks: sourceTasks };
        if (c.id === destination.droppableId) return { ...c, tasks: destTasks };
        return c;
      });
    });

    try {
      if (source.droppableId === "todo") await startTask(draggableId);
      if (source.droppableId === "in-progress") await endTask(draggableId);
      await updateStatus(draggableId, destination.droppableId);
    } catch {
      toast.error("Failed to update task");
      // Reload tasks
      if (projectId && token) {
        fetchWithTimeout(`${baseUrl}/tasks/status/todo/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  };

  // -------------------
  // Render
  // -------------------
  return (
    <div>
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-2">Board</h1>
      <p className="text-slate-400 mb-6">Visualize and manage your project workflow.</p>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 w-64"
        />
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white border border-slate-700"
        >
          <option value="all">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || `User ${u.id}`}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-white">Loading...</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {filteredColumns.map((col) => (
            <Column key={col.id} column={col} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
