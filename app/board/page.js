"use client";
import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import Column from "../components/column";
import { Toaster, toast } from "react-hot-toast";
import { useProject } from "../context/ProjectContext";

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

useEffect(() => {
  if (typeof window !== "undefined") {
    setToken(localStorage.getItem("employeeToken"));
  }
}, []);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // ============================================================
  // Fetch Tasks
  // ============================================================
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const statuses = ["todo", "in-progress", "review", "done"];

      const requests = statuses.map((status) =>
        fetch(`${baseUrl}/tasks/status/${status}/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).then((res) => res.json())
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
    if (projectId) fetchTasks();
  }, [projectId, token]);

  // ============================================================
  // Drag & Drop Logic (Forward Only)
  // ============================================================
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const order = ["todo", "in-progress", "review", "done"];

    const sourceIndex = order.indexOf(sourceColId);
    const destIndex = order.indexOf(destColId);

    // ❌ Block backwards movement
    if (destIndex < sourceIndex) {
      toast.error("You can only move tasks forward.");
      return;
    }

    // ❌ Block dragging inside Done
    if (sourceColId === "done") return;

    // Same column reorder (except done)
    if (sourceColId === destColId && sourceColId !== "done") {
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== sourceColId) return col;

          const newTasks = Array.from(col.tasks);
          const [moved] = newTasks.splice(source.index, 1);
          newTasks.splice(destination.index, 0, moved);

          return { ...col, tasks: newTasks };
        })
      );
      return;
    }

    // ❌ Only allow EXACT next stage
    if (destIndex !== sourceIndex + 1) {
      toast.error("You can only move tasks to the next stage.");
      return;
    }

    // Move task forward
    setColumns((prev) => {
      const sourceCol = prev.find((c) => c.id === sourceColId);
      const destCol = prev.find((c) => c.id === destColId);

      const sourceTasks = Array.from(sourceCol.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);

      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, movedTask);

      return prev.map((c) => {
        if (c.id === sourceColId) return { ...c, tasks: sourceTasks };
        if (c.id === destColId) return { ...c, tasks: destTasks };
        return c;
      });
    });

    // Update backend
    try {
      await fetch(`${baseUrl}/tasks/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: draggableId, status: destColId }),
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  // ============================================================

  return (
    <div>
      <div className="mb-6">
        <Toaster position="top-right" />
        <h1 className="text-3xl font-bold">Board</h1>
        <p className="text-slate-400">Visualize and manage your project workflow.</p>
      </div>

      {loading && <p className="text-white mb-4">Loading tasks...</p>}

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
