"use client";
import { useState, useEffect } from "react";
import {
  Layers,
  Loader,
  Bug,
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { useProject } from "../context/ProjectContext";
import moment from "moment";

export default function DashboardPage() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  // ---------- STATES ----------
  const [projectDetails, setProjectDetails] = useState(null);

  const [userStats, setUserStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("employeeToken")
      : null;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  // ---------------- FETCH USER TASK COUNTS ----------------
  const fetchUserTasks = async () => {
    if (!projectId) return;

    try {
      const res = await axios.get(
        `${baseUrl}/tasks/user-tasks/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = res.data;

      if (data.success) {
        setUserStats({
          todo: data.counts.todo || 0,
          inProgress: data.counts.inProgress || 0,
          review: data.counts.review || 0,
          done: data.counts.done || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load user tasks:", err);
    }
  };

  // ---------------- FETCH PROJECT DETAILS ----------------
const fetchProjectDetails = async () => {
  if (!projectId) return;

  try {
    const res = await axios.get(`${baseUrl}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const project = res.data.data; // important: your response is inside "data"

    // Extract tasks array
    const tasks = project.tasks || [];

    // Count tasks by status
    const counts = {
      todo: tasks.filter(t => t.status === "todo").length,
      inProgress: tasks.filter(t => t.status === "in-progress").length,
      review: tasks.filter(t => t.status === "review").length,
      done: tasks.filter(t => t.status === "done").length,
      backlog: tasks.filter(t => t.status === "backlog").length,
    };

    // Update UI stats
    setUserStats({
      todo: counts.todo,
      inProgress: counts.inProgress,
      review: counts.review,
      done: counts.done,
    });

    // Store project details in state
    setProjectDetails({
      name: project.name,
      description: project.description,
      status: project.status,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      createdAt: project.createdAt,
    });

  } catch (err) {
    console.error("Error fetching project:", err);
  }
};


  useEffect(() => {
    if (!projectId) return;

    fetchUserTasks();
    fetchProjectDetails();
  }, [projectId]);

  // -------- TIMER LOGIC ----------
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(
        () => setSeconds((prev) => prev + 1),
        1000
      );
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // ---------- CARDS ----------
  const stats = [
    {
      id: 1,
      title: "To Do",
      value: userStats.todo,
      desc: "Tasks pending",
      icon: <Layers className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 2,
      title: "In Progress",
      value: userStats.inProgress,
      desc: "Currently working",
      icon: <Loader className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 3,
      title: "Review",
      value: userStats.review,
      desc: "Waiting for approval",
      icon: <Bug className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 4,
      title: "Completed",
      value: userStats.done,
      desc: "Finished issues",
      icon: <CheckCircle2 className="w-5 h-5 text-slate-400" />,
    },
  ];

  // Import moment at the top of your file:
  // import moment from "moment";

  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Welcome back, Developer</h1>
        <p className="text-slate-400 mt-1">
          Your project summary & active tasks live here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow hover:bg-slate-800 transition"
          >
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

          <h3 className="text-lg font-semibold">
            {projectDetails?.name || "Loading..."}
          </h3>

          <span className={`text-sm font-medium px-2 py-1 rounded ${
            projectDetails?.status === "active"
              ? "text-green-400 bg-green-900/30"
              : "text-blue-400 bg-blue-900/30"
          }`}>
            {projectDetails?.status === "active" ? "ACTIVE" : "COMPLETED"}
          </span>

          <p className="text-slate-400 text-sm mt-2">
            {projectDetails?.description || "Fetching project summary..."}
          </p>

          <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
            {/* <div className="flex items-center gap-1">
              <Users size={16} /> {projectDetails?.members?.length || 0} members
            </div> */}
            <div className="flex items-center gap-1">
              <Calendar size={16} /> 
              {projectDetails?.createdAt
                ? moment(projectDetails.createdAt).format("DD-MM-YYYY")
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
