"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Layers, BookOpen, Bug, CheckCircle2, Calendar } from "lucide-react";
import axios from "axios";
import { useProject } from "../context/ProjectContext";
import moment from "moment";

export default function DashboardPage() {
  // ======================
  // State
  // ======================
  const [token, setToken] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [userStats, setUserStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
  });

  const { currentProject } = useProject();
  const projectId = currentProject?.id;
const [userData, setUserData] = useState(null);

useEffect(() => {
  const storedUser = localStorage.getItem("employeeUser");
  if (storedUser) {
    setUserData(JSON.parse(storedUser));
  }
}, []);


  // Prevent refetch storms
  const fetchingRef = useRef(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // ======================
  // Load token (client only)
  // ======================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("employeeToken") || "";
      setToken(savedToken);
    }
  }, []);

  // ======================
  // Fetch dashboard data (SAFE)
  // ======================
  const fetchDashboardData = useCallback(async () => {
    if (!projectId || !token || fetchingRef.current) return;

    fetchingRef.current = true;

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [userDataRes, projectDataRes] = await Promise.allSettled([
        axios.get(`${baseUrl}/tasks/user-tasks/${projectId}`, { headers }),
        axios.get(`${baseUrl}/projects/${projectId}`, { headers }),
      ]);

      // -------- User stats --------
      if (
        userDataRes.status === "fulfilled" &&
        userDataRes.value.data?.success
      ) {
        const counts = userDataRes.value.data.counts || {};
        setUserStats({
          todo: counts.todo || 0,
          inProgress: counts.inProgress || 0,
          review: counts.review || 0,
          done: counts.done || 0,
        });
      }

      // -------- Project details --------
      if (
        projectDataRes.status === "fulfilled" &&
        projectDataRes.value.data?.data
      ) {
        const project = projectDataRes.value.data.data;
        // We set project details, and let useMemo handle the counting 
        // to keep the CPU usage low during the state update phase.
        setProjectDetails({
          name: project.name,
          description: project.description,
          status: project.status,
          clientName: project.clientName,
          clientEmail: project.clientEmail,
          clientPhone: project.clientPhone,
          createdAt: project.createdAt,
          tasks: project.tasks || [], // Keep tasks here for memoized counting
        });
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      fetchingRef.current = false;
    }
  }, [projectId, token, baseUrl]);

  // ======================
  // Effect (single trigger)
  // ======================
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ======================
  // Optimized Stats Calculation
  // ======================
  const stats = useMemo(() => {
    // If we have tasks in projectDetails, they are more up-to-date for the overview
    // otherwise we use the userStats state.
    const counts = projectDetails?.tasks?.length > 0 
      ? projectDetails.tasks.reduce((acc, task) => {
          if (task.status === "todo") acc.todo++;
          else if (task.status === "in-progress") acc.inProgress++;
          else if (task.status === "review") acc.review++;
          else if (task.status === "done") acc.done++;
          return acc;
        }, { todo: 0, inProgress: 0, review: 0, done: 0 })
      : userStats;

    return [
      {
        id: 1,
        title: "To Do",
        value: counts.todo,
        desc: "Tasks pending",
        icon: <Layers className="w-5 h-5 text-slate-400" />,
      },
      {
        id: 2,
        title: "In Progress",
        value: counts.inProgress,
        desc: "Currently working",
        icon: <BookOpen className="w-5 h-5 text-slate-400" />,
      },
      {
        id: 3,
        title: "Review",
        value: counts.review,
        desc: "Waiting for approval",
        icon: <Bug className="w-5 h-5 text-slate-400" />,
      },
      {
        id: 4,
        title: "Completed",
        value: counts.done,
        desc: "Finished issues",
        icon: <CheckCircle2 className="w-5 h-5 text-slate-400" />,
      },
    ];
  }, [projectDetails?.tasks, userStats]);

  // ======================
  // Render
  // ======================
  return (
    <div className="p-4 md:p-6 text-white">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">  Welcome back {userData?.name || ""}</h1>
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

          <div className="mt-2">
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${
                projectDetails?.status === "active"
                  ? "text-green-400 bg-green-900/30"
                  : "text-blue-400 bg-blue-900/30"
              }`}
            >
              {projectDetails?.status === "active" ? "ACTIVE" : "COMPLETED"}
            </span>
          </div>

          <p className="text-slate-400 text-sm mt-4">
            {projectDetails?.description || "Fetching project summary..."}
          </p>

          <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
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
