"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import withAdminAuth from "../../../lib/withAdminAuth";

function ProjectCostPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const [token, setToken] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [loading, setLoading] = useState(false);

  /*
  ==========================
  FORMATTERS
  ==========================
  */

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN").format(value);

  /*
  ==========================
  AUTH TOKEN
  ==========================
  */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = localStorage.getItem("token");

    if (!t) {
      window.location.href = "/admin";
      return;
    }

    setToken(t);
  }, []);

  /*
  ==========================
  FETCH PROJECTS
  ==========================
  */

  useEffect(() => {
    if (!token) return;
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${baseUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || [];

      setProjects(data);

      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Projects fetch error:", err);
    }
  };

  /*
  ==========================
  FETCH PROJECT COST
  ==========================
  */

  useEffect(() => {
    if (!token || !selectedProjectId) return;

    fetchProjectCost(selectedProjectId);
  }, [token, selectedProjectId]);

  const fetchProjectCost = async (projectId) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `${baseUrl}/projects/${projectId}/cost`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data?.data || {};

      setTasks(data.tasks || []);
      setTotalHours(data.totalHours || 0);
      setTotalCost(data.totalCost || 0);

    } catch (err) {
      console.error("Cost fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentProjectCost = tasks.reduce(
  (sum, task) => sum + Number(task.cost || 0),
  0
);

  /*
  ==========================
  UI
  ==========================
  */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">

      <h1 className="text-3xl font-bold mb-8">
        Project Cost Overview
      </h1>

      {/* PROJECT SELECT */}

      <div className="mb-8 max-w-md">
        <label className="block text-slate-400 mb-2 text-sm">
          Select Project
        </label>

        <select
          value={selectedProjectId || ""}
          onChange={(e) =>
            setSelectedProjectId(Number(e.target.value))
          }
          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* SUMMARY */}

  <div className="grid md:grid-cols-4 gap-6 mb-10">

  <SummaryCard
    title="Total Hours"
    value={(totalHours / 3600).toFixed(2)}
  />

  <SummaryCard
    title="Employee Cost"
    value={formatCurrency(totalCost)}
  />

  <SummaryCard
    title="Current Project Cost"
    value={formatCurrency(currentProjectCost)}
  />

   <SummaryCard
    title="Profit / loss"
    value={"0"}
  />

</div>

      {/* TASK COST TABLE */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">

        <h2 className="text-lg font-semibold mb-4">
          Task Cost Breakdown
        </h2>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">

            <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="py-2 text-left">Task</th>
                <th className="py-2 text-left">Employee</th>
                <th className="py-2 text-left">Hours</th>
                <th className="py-2 text-left">Rate</th>
                <th className="py-2 text-left">Cost</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.taskId}
                  className="border-b border-slate-800"
                >
                  <td className="py-2">{task.taskTitle}</td>

                  <td className="py-2">{task.employee}</td>

                  <td className="py-2">
                   {(task.hours / 3600).toFixed(2)}
                  </td>

                  <td className="py-2">
                    {formatCurrency(task.rate)}
                  </td>

                  <td className="py-2 font-medium">
                    {formatCurrency(task.cost)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <p className="text-slate-400 text-sm mb-2">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}// cost estimate

export default withAdminAuth(ProjectCostPage)
