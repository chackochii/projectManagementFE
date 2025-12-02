"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Play, Square, Send } from "lucide-react";
import { useProject } from "../context/ProjectContext";

export default function ActiveTicketPage() {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalHoursToday, setTotalHoursToday] = useState(0);

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("employeeToken");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}/tasks/my-active-tasks/${projectId}`,
        getAuthHeaders()
      );

      const list = Array.isArray(res.data.tasks) ? res.data.tasks : [];
      const filtered = list.filter(
        (t) => t.status !== "completed" && t.status !== "review"
      );

      setTasks(filtered);

      // CHECK if any task is already active (status = in-progress)
      const runningTask = list.find((t) => t.status === "in-progress");

      if (runningTask) {
        setActiveTaskId(runningTask.id);
        setIsRunning(true);

        const diff = Math.floor(
          (Date.now() - new Date(runningTask.startTime)) / 1000
        );
        setSeconds(diff);
      } else {
        setActiveTaskId(null);
        setIsRunning(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startTask = async (task) => {
    try {
      const res = await axios.post(
        `${baseUrl}/tasks/start/${task.id}`,
        {},
        getAuthHeaders()
      );

      setActiveTaskId(task.id);
      setSeconds(0);
      setIsRunning(true);

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const stopTask = async (taskId) => {
    try {
      await axios.post(`${baseUrl}/tasks/end/${taskId}`, {}, getAuthHeaders());

      setIsRunning(false);
      setActiveTaskId(null);
      setSeconds(0);

      // Refresh UI
      await fetchTasks();
      await fetchWorkHours(); // << fetch total hours after stopping
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  };

  const getPriorityColor = (p) =>
    p === "High"
      ? "bg-red-800 text-red-200"
      : p === "Medium"
      ? "bg-yellow-700 text-yellow-200"
      : "bg-green-700 text-green-200";

  const sendToReview = async (taskId) => {
    try {
      await axios.patch(
        `${baseUrl}/tasks/status`,
        { id: taskId, status: "review" },
        getAuthHeaders()
      );

      // Refresh tasks - review tasks will not be shown
      fetchTasks();
    } catch (err) {
      console.error("Review update failed:", err);
    }
  };

  const fetchWorkHours = async () => {
    try {
      const user = localStorage.getItem("employeeUser");
      const userId = user ? JSON.parse(user).id : null;
      if (!userId) return;

      const res = await axios.get(
        `${baseUrl}/task-time/user-one-day/${userId}`,
        getAuthHeaders()
      );

      setTotalHoursToday(res.data.totalHours || 0);
    } catch (err) {
      console.error("Failed to fetch work hours:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchWorkHours();
  }, [projectId]);
  // stopTask(taskId).then(() => fetchWorkHours());

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center">



       <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center">
        <h2 className="text-xl mb-2"> Today Worked:</h2>
        <div className="text-5xl font-mono text-green-400">
              {totalHoursToday.toFixed(2)} hrs 
        </div>
      </div>



      {/* TIMER HEADER */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-10 text-center">
        <h2 className="text-xl mb-2">Active Timer</h2>
        <div className="text-5xl font-mono text-green-400">
          {activeTaskId ? formatTime(seconds) : "00:00:00"}
        
        </div>
      </div>

       
     

      {/* TASK LIST */}
      <div className="w-full max-w-xl space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between"
          >
            <div>
              <span
                className={`px-3 py-1 rounded-lg text-sm ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
              <div className="text-lg mt-1">{task.title}</div>
            </div>

            <div className="flex items-center gap-3">
  {/* PLAY OR STOP */}
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
      className="p-2 bg-green-600 hover:bg-green-700 rounded-full"
    >
      <Play size={20} />
    </button>
  )}

  {/* SEND TO REVIEW */}
  <button
    onClick={() => sendToReview(task.id)}
    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full"
  >
    <Send size={20} />
  </button>

  {/* STATUS BADGE */}
  <div
    className={`px-3 py-1 rounded-lg text-xs font-semibold text-white text-center min-w-[90px] ${
      task.status === "in-progress" ? "bg-green-700" : "bg-gray-700"
    }`}
  >
    {task.status}
  </div>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}
