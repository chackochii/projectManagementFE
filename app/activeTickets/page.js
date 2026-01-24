"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Play, Square, Send } from "lucide-react";
import { useProject } from "../context/ProjectContext";

/* =====================================================
   TaskTimer Component
===================================================== */
function TaskTimer({ task }) {
  const [seconds, setSeconds] = useState(task.hoursTaken || 0);

  useEffect(() => {
    if (!task.isRunning || !task.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
      setSeconds((task.hoursTaken || 0) + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.isRunning, task.startTime, task.hoursTaken]);

  const formatTime = (s = 0) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="font-mono text-green-400 text-sm">
      {formatTime(seconds)}
    </div>
  );
}

/* =====================================================
   ActiveTicketPage
===================================================== */
export default function ActiveTicketPage() {
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState(null);

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /* ================= AUTH ================= */
  useEffect(() => {
    if (typeof window === "undefined") return;

    setToken(localStorage.getItem("employeeToken") || "");
    const user = localStorage.getItem("employeeUser");
    if (user) setUserId(JSON.parse(user).id);
  }, []);

  const getAuthHeaders = useCallback(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  /* ================= FETCH TASKS ================= */
  const fetchTasks = useCallback(async () => {
    if (!projectId || !token) return;

    try {
      const res = await axios.get(
        `${baseUrl}/tasks/my-active-tasks/${projectId}`,
        { ...getAuthHeaders(), timeout: 10000 }
      );

      const list = res.data.tasks || [];

      const active = list
        .filter(
          (t) => t.status !== "completed" && t.status !== "review"
        )
        .map((t) => ({
          ...t,
          startTime: t.startTime ? new Date(t.startTime).getTime() : null,
        }));

      setTasks(active);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [projectId, token, baseUrl, getAuthHeaders]);

  useEffect(() => {
    if (!token || !userId || !projectId) return;
    fetchTasks();
  }, [fetchTasks, token, userId, projectId]);

  /* ================= END TASK (REUSABLE) ================= */
  const endTaskIfRunning = async (task) => {
    if (!task.isRunning) return task;

    const res = await axios.post(
      `${baseUrl}/tasks/end/${task.id}`,
      {},
      getAuthHeaders()
    );

    return {
      ...task,
      isRunning: false,
      hoursTaken: res.data.task.hoursTaken,
      startTime: null,
    };
  };

  /* ================= START / STOP ================= */
  const toggleTask = async (task) => {
    try {
      if (task.isRunning) {
        const updated = await endTaskIfRunning(task);

        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? updated : t))
        );
      } else {
        await axios.post(
          `${baseUrl}/tasks/start/${task.id}`,
          {},
          { ...getAuthHeaders(), timeout: 10000 }
        );

        const startTime = Date.now();

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, isRunning: true, startTime }
              : { ...t, isRunning: false }
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  /* ================= SEND TO REVIEW (FIXED) ================= */
  const sendToReview = async (task) => {
    try {
      let updatedTask = task;

      // 1️⃣ Stop timer FIRST if running
      if (task.isRunning) {
        updatedTask = await endTaskIfRunning(task);

        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? updatedTask : t))
        );
      }

      // 2️⃣ Update status
      await axios.patch(
        `${baseUrl}/tasks/status`,
        { id: task.id, status: "review" },
        getAuthHeaders()
      );

      // 3️⃣ Remove from active list
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error("Failed to send task to review:", err);
    }
  };

  /* ================= HELPERS ================= */
  const getTodayWorkedSeconds = () =>
    tasks.reduce((acc, task) => {
      let seconds = task.hoursTaken || 0;
      if (task.isRunning && task.startTime) {
        seconds += Math.floor((Date.now() - task.startTime) / 1000);
      }
      return acc + seconds;
    }, 0);

  const formatTime = (s = 0) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  };

  const getPriorityColor = (p) =>
    p === "high"
      ? "bg-red-800 text-red-200"
      : p === "medium"
      ? "bg-yellow-700 text-yellow-200"
      : "bg-green-700 text-green-200";

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">
      {/* Today Worked */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center">
        <h2 className="text-xl mb-2">Today Worked</h2>
        <div className="text-5xl font-mono text-green-400">
          {formatTime(getTodayWorkedSeconds())}
        </div>
      </div>

      {/* Tasks */}
      <div className="w-full max-w-xl space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="flex gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-lg text-sm ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                <span className="px-3 py-1 rounded-lg bg-gray-700 text-sm">
                  {task.status}
                </span>
              </div>
              <div className="text-lg">{task.title}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task)}
                  disabled={
                    !task.isRunning && tasks.some((t) => t.isRunning)
                  }
                  className={`p-2 rounded-full ${
                    task.isRunning ? "bg-red-600" : "bg-green-600"
                  } disabled:bg-gray-600`}
                >
                  {task.isRunning ? <Square size={18} /> : <Play size={18} />}
                </button>

                <button
                  onClick={() => sendToReview(task)}
                  className="p-2 bg-blue-600 rounded-full"
                >
                  <Send size={18} />
                </button>
              </div>

              <TaskTimer task={task} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
