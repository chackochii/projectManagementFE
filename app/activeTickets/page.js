"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import axios from "axios";
import { Play, Square, Send } from "lucide-react";
import { useProject } from "../context/ProjectContext";

/* =====================================================
   TaskRow Component (Memoized for performance)
===================================================== */
const TaskRow = memo(({ task, onToggle, onReview, isAnyOtherRunning, formatTime }) => {
  // Calculate seconds locally based on the current "tick" to avoid internal state overhead
  const [displaySeconds, setDisplaySeconds] = useState(task.hoursTaken || 0);

  useEffect(() => {
    let interval;
    if (task.isRunning && task.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
        setDisplaySeconds((task.hoursTaken || 0) + elapsed);
      }, 1000);
    } else {
      setDisplaySeconds(task.hoursTaken || 0);
    }
    return () => clearInterval(interval);
  }, [task.isRunning, task.startTime, task.hoursTaken]);

  const getPriorityColor = (p) =>
    p === "high"
      ? "bg-red-800 text-red-200"
      : p === "medium"
      ? "bg-yellow-700 text-yellow-200"
      : "bg-green-700 text-green-200";

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center">
      <div>
        <div className="flex gap-2 mb-2">
          <span className={`px-3 py-1 rounded-lg text-sm ${getPriorityColor(task.priority)}`}>
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
            onClick={() => onToggle(task)}
            disabled={!task.isRunning && isAnyOtherRunning}
            className={`p-2 rounded-full ${task.isRunning ? "bg-red-600" : "bg-green-600"} disabled:bg-gray-600 transition-colors`}
          >
            {task.isRunning ? <Square size={18} /> : <Play size={18} />}
          </button>

          <button onClick={() => onReview(task)} className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
            <Send size={18} />
          </button>
        </div>
        <div className="font-mono text-green-400 text-sm">
          {formatTime(displaySeconds)}
        </div>
      </div>
    </div>
  );
});
TaskRow.displayName = "TaskRow";

/* =====================================================
   ActiveTicketPage
===================================================== */
export default function ActiveTicketPage() {
  const [tasks, setTasks] = useState([]);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState(null);
  const [globalTick, setGlobalTick] = useState(0); // Used to sync the "Today Worked" clock

  const { currentProject } = useProject();
  const projectId = currentProject?.id;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 1. SSR & Auth Headers stabilization
  useEffect(() => {
    if (typeof window === "undefined") return;
    setToken(localStorage.getItem("employeeToken") || "");
    const user = localStorage.getItem("employeeUser");
    if (user) setUserId(JSON.parse(user).id);
  }, []);

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // 2. Global interval for the header clock
  useEffect(() => {
    const isRunning = tasks.some(t => t.isRunning);
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setGlobalTick(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    if (!projectId || !token) return;
    try {
      const res = await axios.get(`${baseUrl}/tasks/my-active-tasks/${projectId}`, { 
        ...authConfig, 
        timeout: 10000 
      });
      const list = res.data.tasks || [];
      const active = list
        .filter((t) => t.status !== "completed" && t.status !== "review")
        .map((t) => ({
          ...t,
          startTime: t.startTime ? new Date(t.startTime).getTime() : null,
        }));
      setTasks(active);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [projectId, token, baseUrl, authConfig]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const endTaskIfRunning = async (task) => {
    if (!task.isRunning) return task;
    const res = await axios.post(`${baseUrl}/tasks/end/${task.id}`, {}, authConfig);
    return {
      ...task,
      isRunning: false,
      hoursTaken: res.data.task.hoursTaken,
      startTime: null,
    };
  };

  const toggleTask = async (task) => {
    try {
      if (task.isRunning) {
        const updated = await endTaskIfRunning(task);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      } else {
        await axios.post(`${baseUrl}/tasks/start/${task.id}`, {}, { ...authConfig, timeout: 10000 });
        const startTime = Date.now();
        setTasks((prev) => prev.map((t) =>
          t.id === task.id ? { ...t, isRunning: true, startTime } : { ...t, isRunning: false }
        ));
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const sendToReview = async (task) => {
    try {
      if (task.isRunning) await endTaskIfRunning(task);
      await axios.patch(`${baseUrl}/tasks/status`, { id: task.id, status: "review" }, authConfig);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error("Failed to send task to review:", err);
    }
  };

  const formatTime = useCallback((s = 0) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  const totalTodaySeconds = useMemo(() => {
    return tasks.reduce((acc, task) => {
      let seconds = task.hoursTaken || 0;
      if (task.isRunning && task.startTime) {
        seconds += Math.floor((Date.now() - task.startTime) / 1000);
      }
      return acc + seconds;
    }, 0);
  }, [tasks, globalTick]); // Recalculate based on globalTick to move the clock

  const isAnyOtherRunning = useMemo(() => tasks.some(t => t.isRunning), [tasks]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center shadow-xl">
        <h2 className="text-xl mb-2 text-slate-400">Today Worked</h2>
        <div className="text-5xl font-mono text-green-400 tracking-tighter">
          {formatTime(totalTodaySeconds)}
        </div>
      </div>

      <div className="w-full max-w-xl space-y-4">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onReview={sendToReview}
            isAnyOtherRunning={isAnyOtherRunning && !task.isRunning}
            formatTime={formatTime}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-slate-500 mt-10">No active tickets for this project.</div>
        )}
      </div>
    </div>
  );
}
