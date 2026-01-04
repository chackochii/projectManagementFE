"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Play, Square, Send } from "lucide-react";
import { useProject } from "../context/ProjectContext";

export default function ActiveTicketPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTaskStartTime, setActiveTaskStartTime] = useState(null);

  const [totalSecondsFromBackend, setTotalSecondsFromBackend] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [token, setToken] = useState("");
  const [userId, setUserId] = useState(null);

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  /* =====================================================
     AUTH
  ===================================================== */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("employeeToken") || "");
      const user = localStorage.getItem("employeeUser");
      if (user) setUserId(JSON.parse(user).id);
    }
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  /* =====================================================
     GLOBAL TICK (DRIVES ALL TIMERS)
  ===================================================== */
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* =====================================================
     FETCH TASKS
  ===================================================== */
  const fetchTasks = async () => {
    if (!projectId || !token) return;

    const res = await axios.get(
      `${baseUrl}/tasks/my-active-tasks/${projectId}`,
      {
        ...getAuthHeaders(),
        timeout: 10000,
      }
    );

    const list = res.data.tasks || [];
    const filtered = list.filter(
      (t) => t.status !== "completed" && t.status !== "review"
    );

    setTasks(filtered);

    const running = filtered.find(
      (t) => t.status === "in-progress" && t.startTime
    );

    if (running) {
      setActiveTaskId(running.id);
      setActiveTaskStartTime(new Date(running.startTime).getTime());
    } else {
      setActiveTaskId(null);
      setActiveTaskStartTime(null);
    }
  };

  /* =====================================================
     FETCH TODAY WORKED (BACKEND)
  ===================================================== */
  const fetchWorkHours = async () => {
    if (!userId) return;

    const res = await axios.get(
      `${baseUrl}/task-time/user-one-day/${userId}`,
      getAuthHeaders()
    );

    setTotalSecondsFromBackend(res.data.totalHours || 0);
  };

  useEffect(() => {
     if (!token || !userId || !projectId) return;
    fetchTasks();
    fetchWorkHours();
  }, [projectId, token]);

  /* =====================================================
     START / STOP
  ===================================================== */
  const startTask = async (task) => {
    await axios.post(
      `${baseUrl}/tasks/start/${task.id}`,
      {
        ...getAuthHeaders(),
        timeout: 10000,
      }
    );

    setActiveTaskId(task.id);
    setActiveTaskStartTime(Date.now());
    fetchTasks();
  };

  const stopTask = async (taskId) => {
    await axios.post(
      `${baseUrl}/tasks/end/${taskId}`,
      {},
      getAuthHeaders()
    );

    setActiveTaskId(null);
    setActiveTaskStartTime(null);
    fetchTasks();
    fetchWorkHours();
  };

  const sendToReview = async (taskId) => {
    await axios.patch(
      `${baseUrl}/tasks/status`,
      { id: taskId, status: "review" },
      getAuthHeaders()
    );

    fetchTasks();
    fetchWorkHours();
  };

  /* =====================================================
     DERIVED TIMERS (NO STATE DRIFT)
  ===================================================== */
  const getTodayWorkedSeconds = () => {
    if (!activeTaskStartTime) return totalSecondsFromBackend;
    return (
      totalSecondsFromBackend +
      Math.floor((now - activeTaskStartTime) / 1000)
    );
  };

  const getTaskSeconds = (task) => {
    let seconds = task.hoursTaken || 0;

    if (task.status === "in-progress" && task.startTime) {
      seconds += Math.floor(
        (now - new Date(task.startTime).getTime()) / 1000
      );
    }

    return seconds;
  };

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

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">

      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center">
        <h2 className="text-xl mb-2">Today Worked</h2>
        <div className="text-5xl font-mono text-green-400">
          {formatTime(getTodayWorkedSeconds())}
        </div>
      </div>

      <div className="w-full max-w-xl space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex justify-between items-center"
          >
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

  {/* Buttons row */}
  <div className="flex items-center gap-3">
    {task.status === "in-progress" ? (
      <button
        onClick={() => stopTask(task.id)}
        className="p-2 bg-red-600 rounded-full"
      >
        <Square size={18} />
      </button>
    ) : (
      <button
        onClick={() => startTask(task)}
        disabled={activeTaskId && activeTaskId !== task.id}
        className="p-2 bg-green-600 rounded-full disabled:bg-gray-600"
      >
        <Play size={18} />
      </button>
    )}

    <button
      onClick={() => sendToReview(task.id)}
      className="p-2 bg-blue-600 rounded-full"
    >
      <Send size={18} />
    </button>
  </div>

  {/* Timer below buttons */}
  <div className="font-mono text-green-400 text-sm">
    {formatTime(getTaskSeconds(task))}
  </div>

</div>

          </div>
        ))}
      </div>
    </div>
  );
}
