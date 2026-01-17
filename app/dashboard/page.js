"use client";
import { useState, useEffect, useRef } from "react";
import { Layers, BookOpen, Bug, CheckCircle2, Calendar } from "lucide-react";
import axios from "axios";
import { useProject } from "../context/ProjectContext";
import moment from "moment";

export default function DashboardPage() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [token, setToken] = useState("");

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const [projectDetails, setProjectDetails] = useState(null);
  const [userStats, setUserStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // Get token safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("employeeToken") || "");
    }
  }, []);

  // Fetch API with timeout using AbortController
  const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await axios.get(url, { ...options, signal: controller.signal });
      return res.data;
    } catch (err) {
      console.error("Fetch failed:", err.message);
      return null;
    } finally {
      clearTimeout(id);
    }
  };

  const fetchDashboardData = async () => {
    if (!projectId || !token) return;

    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      // Fetch both APIs in parallel
      const [userData, projectData] = await Promise.allSettled([
        fetchWithTimeout(`${baseUrl}/tasks/user-tasks/${projectId}`, { headers }),
        fetchWithTimeout(`${baseUrl}/projects/${projectId}`, { headers }),
      ]);

      // User stats
      if (userData.status === "fulfilled" && userData.value?.success) {
        const counts = userData.value.counts || {};
        setUserStats({
          todo: counts.todo || 0,
          inProgress: counts.inProgress || 0,
          review: counts.review || 0,
          done: counts.done || 0,
        });
      }

      // Project details
      if (projectData.status === "fulfilled" && projectData.value?.data) {
        const project = projectData.value.data;
        const tasks = project.tasks || [];
        setUserStats({
          todo: tasks.filter((t) => t.status === "todo").length,
          inProgress: tasks.filter((t) => t.status === "in-progress").length,
          review: tasks.filter((t) => t.status === "review").length,
          done: tasks.filter((t) => t.status === "done").length,
        });

        setProjectDetails({
          name: project.name,
          description: project.description,
          status: project.status,
          clientName: project.clientName,
          clientEmail: project.clientEmail,
          clientPhone: project.clientPhone,
          createdAt: project.createdAt,
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

 useEffect(() => {
  if (!projectId || !token) return;

  // Optional: reset old data while fetching new
  setProjectDetails(null);
  setUserStats({ todo: 0, inProgress: 0, review: 0, done: 0 });

  fetchDashboardData();
}, [projectId, token]);

  // Timer
  useEffect(() => {
    let interval;
    if (isRunning) interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const stats = [
    { id: 1, title: "To Do", value: userStats.todo, desc: "Tasks pending", icon: <Layers className="w-5 h-5 text-slate-400" /> },
    { id: 2, title: "In Progress", value: userStats.inProgress, desc: "Currently working", icon: <BookOpen className="w-5 h-5 text-slate-400" /> },
    { id: 3, title: "Review", value: userStats.review, desc: "Waiting for approval", icon: <Bug className="w-5 h-5 text-slate-400" /> },
    { id: 4, title: "Completed", value: userStats.done, desc: "Finished issues", icon: <CheckCircle2 className="w-5 h-5 text-slate-400" /> },
  ];

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Welcome back, Developer</h1>
        <p className="text-slate-400 mt-1">Your project summary & active tasks live here.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow hover:bg-slate-800 transition">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              {item.icon}
            </div>
            <div className="text-4xl font-bold">{item.value}</div>
            <p className="text-slate-400 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow">
          <h2 className="text-xl font-semibold mb-6">Project Overview</h2>
          <h3 className="text-lg font-semibold">{projectDetails?.name || "Loading..."}</h3>
          <span className={`text-sm font-medium px-2 py-1 rounded ${projectDetails?.status === "active" ? "text-green-400 bg-green-900/30" : "text-blue-400 bg-blue-900/30"}`}>
            {projectDetails?.status === "active" ? "ACTIVE" : "COMPLETED"}
          </span>
          <p className="text-slate-400 text-sm mt-2">{projectDetails?.description || "Fetching project summary..."}</p>
          <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar size={16} /> {projectDetails?.createdAt ? moment(projectDetails.createdAt).format("DD-MM-YYYY") : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
