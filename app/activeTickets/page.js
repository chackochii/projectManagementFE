"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Play, Square, Send } from "lucide-react";
import { useProject } from "../context/ProjectContext";

export default function ActiveTicketPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  const [taskTimers, setTaskTimers] = useState({});
  const [liveSeconds, setLiveSeconds] = useState(0); // For today-worked live update

  const [totalHoursToday, setTotalHoursToday] = useState(0);

  const [token, setToken] = useState("");
  const [userId, setUserId] = useState(null);

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  /** Load auth info */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("employeeToken") || "");

      const user = localStorage.getItem("employeeUser");
      if (user) setUserId(JSON.parse(user).id);
    }
  }, []);

  /** Auth headers */
  const getAuthHeaders = () => {
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // --------------------------------------------------------------------
  // 🕒 GLOBAL “TODAY WORKED” LIVE TIMER
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!activeTaskId) return;

    const interval = setInterval(() => {
      setLiveSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskId]);

  // --------------------------------------------------------------------
  // 🕒 PER-TASK LIVE TIMER (RESUME FROM hoursTaken)
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!activeTaskId) return;

    const interval = setInterval(() => {
      setTaskTimers((prev) => ({
        ...prev,
        [activeTaskId]: (prev[activeTaskId] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskId]);

  // --------------------------------------------------------------------
  // 📌 FETCH TASKS
  // --------------------------------------------------------------------
  const fetchTasks = async () => {
    if (!projectId || !token) return;

    try {
      const res = await axios.get(
        `${baseUrl}/tasks/my-active-tasks/${projectId}`,
        getAuthHeaders()
      );

      const list = res.data.tasks || [];
      const filtered = list.filter(
        (t) => t.status !== "completed" && t.status !== "review"
      );

      setTasks(filtered);

      const runningTask = filtered.find((t) => t.status === "in-progress");

      if (runningTask) {
        setActiveTaskId(runningTask.id);

        // Restore previous hoursTaken
        const baseSeconds = runningTask.hoursTaken || 0;

        setTaskTimers((prev) => ({
          ...prev,
          [runningTask.id]: baseSeconds,
        }));
      } else {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  };

  // --------------------------------------------------------------------
  // ▶️ START TASK
  // --------------------------------------------------------------------
  const startTask = async (task) => {
     setActiveTaskId(task.id);
    await axios.post(`${baseUrl}/tasks/start/${task.id}`, {}, getAuthHeaders());

   

    // Resume from backend hoursTaken
    setTaskTimers((prev) => ({
      ...prev,
      [task.id]: task.hoursTaken || 0,
    }));

    fetchTasks();
  };

  // --------------------------------------------------------------------
  // ⏹ STOP TASK
  // --------------------------------------------------------------------
  const stopTask = async (taskId) => {
    await axios.post(`${baseUrl}/tasks/end/${taskId}`, {}, getAuthHeaders());

    // DO NOT reset timer — keep final value
    setActiveTaskId(null);

    fetchTasks();
    setTimeout(fetchWorkHours, 600);
  };

  // --------------------------------------------------------------------
  // 📌 SEND TO REVIEW
  // --------------------------------------------------------------------
  const sendToReview = async (taskId) => {
    await axios.patch(
      `${baseUrl}/tasks/status`,
      { id: taskId, status: "review" },
      getAuthHeaders()
    );

    fetchTasks();
    setTimeout(fetchWorkHours, 500);
  };

  // --------------------------------------------------------------------
  // 🕒 FETCH TOTAL HOURS TODAY
  // --------------------------------------------------------------------
  const fetchWorkHours = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(
        `${baseUrl}/task-time/user-one-day/${userId}`,
        getAuthHeaders()
      );

      setTotalHoursToday(res.data.totalHours);
    } catch (err) {
      console.error("Failed to fetch work hours:", err);
    }
  };

  // --------------------------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!token) return;
    fetchTasks();
    fetchWorkHours();
  }, [projectId, token]);

  // --------------------------------------------------------------------
  // FORMAT TIME
  // --------------------------------------------------------------------
  const formatTime = (s) => {
    if (!s) s = 0;
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

  return (
  <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">

  {/* TODAY WORKED CARD */}
  <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center">
    <h2 className="text-xl mb-2"> Today Worked: </h2>
    <div className="text-5xl font-mono text-green-400">
    {formatTime( totalHoursToday + (activeTaskId ? liveSeconds : 0))}
    </div>
  </div>



 {/* TASK LIST */}
<div className="w-full max-w-xl space-y-4">
  {tasks.map((task) => (
    <div
      key={task.id}
      className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
    >
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-2 flex-1">
        {/* Priority + Status */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-sm ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>

          <span
            className={`px-3 py-1 rounded-lg text-sm font-semibold text-white
              ${task.status === "in-progress" ? "bg-green-700" : "bg-gray-700"}
            `}
          >
            {task.status}
          </span>
        </div>

        {/* Title */}
        <div className="text-lg">{task.title}</div>
      </div>

      {/* RIGHT SIDE BUTTONS + TIMER */}
      <div className="flex flex-col items-center sm:items-end gap-3">
        <div className="flex items-center gap-3">
          {task.status === "in-progress" ? (
            <button
              onClick={() => stopTask(task.id)}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-full"
            >
              <Square size={20} />
            </button>
          ) : (
            <button
              onClick={() => startTask(task)}
              disabled={activeTaskId && activeTaskId !== task.id}
              className={`p-2 rounded-full 
                ${
                  activeTaskId && activeTaskId !== task.id
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }
              `}
            >
              <Play size={20} />
            </button>
          )}

          <button
            onClick={() => sendToReview(task.id)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            <Send size={20} />
          </button>
        </div>

        {/* TIMER BELOW BUTTONS */}
        <div className="text-green-400 font-mono text-lg text-center">
          {task.status === "in-progress"
            ? formatTime(taskTimers[task.id] || 0)
            : "00:00:00"}
        </div>
      </div>
    </div>
  ))}
</div>




</div>

  );
}
