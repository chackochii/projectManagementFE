"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

/* ======================================================
   MAIN PAGE
====================================================== */
export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /* =========================
     RESPONSIVE (SSR SAFE)
  ========================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const resize = () => setIsMobile(window.innerWidth <= 640);
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* =========================
     AUTH HEADERS (SAFE)
  ========================= */
  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("employeeToken");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, []);

  /* =========================
     FETCH PROJECTS (USER ONLY)
  ========================= */
  const fetchProjects = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("employeeUser") || "{}");
      const userId = user?.id;
      if (!userId) return;

      const res = await axios.get(
        `${baseUrl}/project-members/user/${userId}/projects`,
        getAuthHeaders()
      );

      const data = res.data?.data || [];
      setProjects(data);

      // Compute stats in single pass
      const counts = { total: 0, active: 0, completed: 0, cancelled: 0 };
      data.forEach((p) => {
        counts.total++;
        if (p.status === "active") counts.active++;
        else if (p.status === "completed") counts.completed++;
        else if (p.status === "cancelled") counts.cancelled++;
      });

      setStats(counts);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, getAuthHeaders]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="p-4 md:p-6">
      <Toaster />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-4xl font-bold">Projects</h1>
        <button
          onClick={() => {
            setEditingProject(null);
            setShowProjectModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full shadow-lg"
        >
          + Add Project
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Projects" value={stats.total} />
        <StatCard title="Active" value={stats.active} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard title="Cancelled" value={stats.cancelled} />
      </div>

      {/* MOBILE VIEW */}
      {isMobile ? (
        loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-900 p-4 rounded-2xl shadow-md"
              >
                <h2 className="font-semibold">{project.name}</h2>
                <p className="text-sm text-slate-400">
                  Client: {project.clientName || "—"}
                </p>

                <StatusBadge status={project.status} />

                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 bg-slate-800 py-2 rounded-full"
                    onClick={() => {
                      setEditingProject(project);
                      setShowProjectModal(true);
                    }}
                  >
                    Edit
                  </button>
                </div>

                <button
                  className="mt-3 w-full bg-blue-600 py-2 rounded-full"
                  onClick={() => {
                    setEditingProject(project);
                    setShowAssignModal(true);
                  }}
                >
                  Assign Users
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* DESKTOP TABLE */
        <div className="bg-slate-900 rounded-2xl p-4 shadow-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left">Project</th>
                <th className="p-3">Client</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-slate-800"
                >
                  <td className="p-3">{project.name}</td>
                  <td className="p-3">{project.clientName || "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="p-3">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      className="bg-slate-800 px-4 py-1 rounded-full"
                      onClick={() => {
                        setEditingProject(project);
                        setShowProjectModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-blue-600 px-4 py-1 rounded-full"
                      onClick={() => {
                        setEditingProject(project);
                        setShowAssignModal(true);
                      }}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {showProjectModal && (
        <CreateProjectModal
          project={editingProject}
          closeModal={() => setShowProjectModal(false)}
          refreshProjects={fetchProjects}
        />
      )}

      {showAssignModal && (
        <AssignUserModal
          project={editingProject}
          closeModal={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}

/* ======================================================
   SUPPORT COMPONENTS
====================================================== */

function StatusBadge({ status }) {
  const map = {
    active: "bg-green-500/20 text-green-400",
    completed: "bg-blue-500/20 text-blue-400",
    cancelled: "bg-red-500/20 text-red-400",
    "on-hold": "bg-yellow-500/20 text-yellow-400",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-center">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}


/* ======================================================
   CREATE / EDIT MODAL (CLIENT DROPDOWN FIXED)
====================================================== */

function CreateProjectModal({ project, closeModal, refreshProjects }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
    clientId: project?.clientId || "",
  });

  const isEdit = Boolean(project);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    axios
      .get(`${baseUrl}/clients`, { headers: headers() })
      .then(res => setClients(res.data || []))
      .catch(() => setClients([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        isEdit ? `${baseUrl}/projects/${project.id}` : `${baseUrl}/projects`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify(form),
        }
      );
      toast.success(isEdit ? "Project updated" : "Project created");
      refreshProjects();
      closeModal();
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold">
          {isEdit ? "Edit Project" : "Create Project"}
        </h2>

        <input
          placeholder="Project Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 bg-slate-800 rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 bg-slate-800 rounded"
        />

        {/* CLIENT DROPDOWN */}
        <select
          value={form.clientId}
          onChange={e => setForm({ ...form, clientId: e.target.value })}
          className="w-full p-2 bg-slate-800 rounded"
          required
        >
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
          className="w-full p-2 bg-slate-800 rounded"
        >
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={closeModal} className="px-5 py-2 bg-slate-700 rounded-full">
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 bg-blue-600 rounded-full">
            {isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ======================================================
   ASSIGN USER MODAL
====================================================== */

function AssignUserModal({ project, closeModal }) {
  const [allUsers, setAllUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  /* =========================
     FETCH USERS + MEMBERS
  ========================= */
const fetchData = async () => {
  try {
    setLoading(true);

    const [usersRes, membersRes] = await Promise.all([
      axios.get(`${baseUrl}/users`, { headers: authHeaders() }),
      axios.get(
        `${baseUrl}/project-members/${project.id}/members`,
        { headers: authHeaders() }
      ),
    ]);

    // USERS
    const users =
      Array.isArray(usersRes.data?.data)
        ? usersRes.data.data
        : Array.isArray(usersRes.data)
        ? usersRes.data
        : [];

    // MEMBERS — FIXED FOR YOUR RESPONSE
    const projectMembers =
      Array.isArray(membersRes.data?.members?.data)
        ? membersRes.data.members.data
        : [];

    setAllUsers(users);
    setMembers(projectMembers);
  } catch (err) {
    toast.error("Failed to load users");
    setAllUsers([]);
    setMembers([]);
  } finally {
    setLoading(false);
  }
};




  useEffect(() => {
    fetchData();
  }, []);

  /* =========================
     ADD USER
  ========================= */
  const addUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.post(
        `${baseUrl}/project-members/${project.id}/add-user`,
        { userId: selectedUser },
        { headers: authHeaders() }
      );
      toast.success("User added to project");
      setSelectedUser("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Add failed");
    }
  };

  /* =========================
     REMOVE USER
  ========================= */
  const removeUser = async (userId) => {
    if (!confirm("Remove user from project?")) return;

    try {
      await axios.delete(
        `${baseUrl}/project-members/${project.id}/remove-user/${userId}`,
        { headers: authHeaders() }
      );
      toast.success("User removed");
      fetchData();
    } catch {
      toast.error("Remove failed");
    }
  };

  /* =========================
     FILTER USERS NOT ADDED
  ========================= */
const safeMembers = Array.isArray(members) ? members : [];

const availableUsers = allUsers.filter(
  u => !safeMembers.some(m => m.id === u.id)
);


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold">Assign Users</h2>

        {/* ADD USER */}
        <div className="flex gap-2">
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="flex-1 p-2 bg-slate-800 rounded"
          >
            <option value="">Select user</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <button
            onClick={addUser}
            className="bg-blue-600 px-4 rounded-full"
          >
            Add
          </button>
        </div>

        {/* MEMBERS LIST */}
        <div className="space-y-2 max-h-64 overflow-auto">
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-slate-400">No users assigned</p>
          ) : (
            members.map(user => (
              <div
                key={user.id}
                className="flex justify-between items-center bg-slate-800 p-3 rounded-xl"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>

                <button
                  onClick={() => removeUser(user.id)}
                  className="text-red-400 bg-red-600/20 px-3 py-1 rounded-full"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="px-6 py-2 bg-slate-700 rounded-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
