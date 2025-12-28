"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function ProjectUserTimeReport() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("employeeToken");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

useEffect(() => {
  fetchUsers();

  // Load default projects for the logged-in user
  const user = localStorage.getItem("employeeUser");
  const defaultUserId = JSON.parse(user)?.id;
  fetchProjectsForUser(defaultUserId);
}, []);

// Fetch projects for a selected user
const fetchProjectsForUser = async (userId) => {
  if (!userId) {
    setProjects([]);
    return;
  }

  const res = await axios.get(
    `${baseUrl}/project-members/user/${userId}/projects`,
    getAuthHeaders()
  );

  setProjects(res.data.data || []);
};

// Fetch all users
const fetchUsers = async () => {
  const res = await axios.get(`${baseUrl}/users`, getAuthHeaders());
  const list = Array.isArray(res.data.data) ? res.data.data : res.data;
  setUsers(list || []);
};


  const fetchReport = async () => {
    if (!selectedProject) return;

    setLoading(true);
    const projectId =selectedProject

    const res = await axios.get(`${baseUrl}/task-time/${projectId}`, {
      ...getAuthHeaders(),
      params: {
        userId: selectedUser || undefined,
      },
    });

    setReportData(res.data.tasks || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [selectedProject, selectedUser]);

  return (
    <div className="p-6 max-w-6xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Project Task Time Report</h1>

      {/* Filters */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-200"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Select User (Optional)
            </label>
<select
  value={selectedUser}
  onChange={(e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    // fetchProjectsForUser(userId); 
  }}
  className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-200"
>
  <option value="">-- All Users --</option>
  {users.map((u) => (
    <option key={u.id} value={u.id}>
      {u.name}
    </option>
  ))}
</select>


          </div>
        </div>
      </div>

      {/* Report */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg"
      >
        {loading ? (
          <p className="text-slate-400">Loading report...</p>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="p-3 text-left">Task ID</th>
                    <th className="p-3 text-left">Task Name</th>
                    <th className="p-3 text-left">Hours Taken</th>
                  </tr>
                </thead>

                <tbody>
                  {reportData.map((row) => (
                    <tr
                      key={row.taskId}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition"
                    >
                      <td className="p-3">{row.taskId}</td>
                      <td className="p-3 text-slate-300">{row.taskName}</td>
                      <td className="p-3 font-semibold">
                        {row.hoursTaken.toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {reportData.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-5 text-center text-slate-500"
                      >
                        No data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {reportData.map((row) => (
                <div
                  key={row.taskId}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700"
                >
                  <h2 className="text-lg font-semibold">{row.taskName}</h2>
                  <p className="text-slate-400 text-sm">Task ID: {row.taskId}</p>

                  <div className="mt-3 text-sm">
                    <p>
                      <span className="text-slate-500">Hours Taken:</span>{" "}
                      <strong>{row.hoursTaken.toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              ))}

              {reportData.length === 0 && (
                <p className="text-center text-slate-500 mt-4">
                  No data found.
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
