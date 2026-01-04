"use client";
import { useState, useEffect, useRef } from "react";
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
    return []; // fallback to empty array
  } finally {
    clearTimeout(id);
  }
};

export default function Board() {
  const [columns, setColumns] = useState([
    { id: "todo", title: "To Do", tasks: [] },
    { id: "in-progress", title: "In Progress", tasks: [] },
    { id: "review", title: "Review", tasks: [] },
    { id: "done", title: "Done", tasks: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const { currentProject } = useProject();
  const projectId = currentProject?.id;
  const hasFetched = useRef(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // ============================
  // Fetch Tasks
  // ============================
  const fetchTasks = async () => {
    if (!projectId || !token) return;
    setLoading(true);

    const statuses = ["todo", "in-progress", "review", "done"];

    try {
      const requests = statuses.map((status) =>
        fetchWithTimeout(`${baseUrl}/tasks/status/${status}/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const results = await Promise.all(requests);

      setColumns((prev) =>
        prev.map((col, index) => ({
          ...col,
          tasks: Array.isArray(results[index])
            ? results[index].map((task) => ({
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("employeeToken") || "");
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current && projectId && token) {
      hasFetched.current = true;
      fetchTasks();
    }
  }, [projectId, token]);

  // ============================
  // Task Mutations with Timeout
  // ============================
  const startTask = (taskId) =>
    fetchWithTimeout(`${baseUrl}/tasks/start/${taskId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

  const endTask = (taskId) =>
    fetchWithTimeout(`${baseUrl}/tasks/end/${taskId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

  const updateStatus = (taskId, status) =>
    fetchWithTimeout(`${baseUrl}/tasks/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });

  // ============================
  // Drag & Drop Logic
  // ============================
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const order = ["todo", "in-progress", "review", "done"];
    const sourceIndex = order.indexOf(sourceColId);
    const destIndex = order.indexOf(destColId);

    if (destIndex < sourceIndex) {
      toast.error("You can only move tasks forward.");
      return;
    }

    if (sourceColId === "done") return;

    if (destIndex !== sourceIndex + 1) {
      toast.error("You can only move tasks to the next stage.");
      return;
    }

    // Optimistic UI update
    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === sourceColId);
      const destCol = prev.find((c) => c.id === destColId);

      const sourceTasks = Array.from(sourceCol.tasks);
      const [task] = sourceTasks.splice(source.index, 1);

      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, task);

      return prev.map((c) => {
        if (c.id === sourceColId) return { ...c, tasks: sourceTasks };
        if (c.id === destColId) return { ...c, tasks: destTasks };
        return c;
      });
    });

    try {
      if (sourceColId === "todo" && destColId === "in-progress") await startTask(draggableId);
      if (sourceColId === "in-progress" && destColId === "review") await endTask(draggableId);
      await updateStatus(draggableId, destColId);
    } catch (err) {
      toast.error("Failed to update task");
      fetchTasks(); // rollback
    }
  };

  // ============================

  return (
    <div>
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-2">Board</h1>
      <p className="text-slate-400 mb-6">
        Visualize and manage your project workflow.
      </p>

      {loading && <p className="text-white">Loading tasks...</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {columns.map((col) => (
            <Column key={col.id} column={col} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
