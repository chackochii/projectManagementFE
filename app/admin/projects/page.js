"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "../../components/projectModal";
import { toast, Toaster } from "react-hot-toast";
import { UserPlus } from "lucide-react";

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);


  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchProjects();
  }, []);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${baseUrl}/projects/`, getAuthHeaders());
      const data = res.data.data;

      setProjects(data);

      // Stats
      setStats({
        total: data.length,
        active: data.filter((p) => p.status === "active").length,
        completed: data.filter((p) => p.status === "completed").length,
        cancelled: data.filter((p) => p.status === "cancelled").length,
      });
    } catch (err) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (project) => {
    setSelectedProject(project);
    setShowAssignModal(true);
  };

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-slate-400">Manage and track project progress.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Active" value={stats.active} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard title="Cancelled" value={stats.cancelled} />
      </div>

      {/* PROJECT LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Project List</h2>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-slate-400">No projects found.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="p-3">Project</th>
                <th className="p-3">Client</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-slate-800">
                  <td className="p-3">{project.name}</td>
                  <td className="p-3">{project.clientName || "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="p-3">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-right flex gap-3 justify-end">

                    {/* Assign User Button */}
                    <button
                      onClick={() => openAssignModal(project)}
                      className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg"
                    >
                      <UserPlus size={16} /> Assign Users
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <CreateProjectModal
          closeModal={() => setShowCreateModal(false)}
          refreshProjects={fetchProjects}
        />
      )}

      {/* ASSIGN USERS MODAL */}
      {showAssignModal && (
        <AssignUserModal
          project={selectedProject}
          closeModal={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}

/* STATUS BADGE */
function StatusBadge({ status }) {
  const color = {
    active: "text-green-400 bg-green-500/20",
    completed: "text-blue-400 bg-blue-500/20",
    cancelled: "text-red-400 bg-red-500/20",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm ${color[status] || "bg-slate-700"}`}
    >
      {status}
    </span>
  );
}

/* STAT CARD */
function StatCard({ title, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
      <h3 className="text-slate-400">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}



function CreateProjectModal({ closeModal, refreshProjects }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    status: "active",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${baseUrl}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create project");

      toast.success("Project created successfully!");
      refreshProjects();
      closeModal();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl w-full max-w-lg border border-slate-700">

        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>

          <div>
            <label className="text-sm text-slate-300">Project Name</label>
            <input
              type="text"
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Client Name</label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Client Email</label>
            <input
              type="email"
              name="clientEmail"
              value={form.clientEmail}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Client Phone</label>
            <input
              type="text"
              name="clientPhone"
              value={form.clientPhone}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full mt-1 p-2 rounded bg-slate-800 border border-slate-700"
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


function AssignUserModal({ project, closeModal }) {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* FETCH ALL USERS AND ASSIGNED USERS */
  useEffect(() => {
    if (!project) return;
    fetchUsers();
    fetchAssignedUsers();
  }, [project]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/users/`, getAuthHeaders());
      setUsers(res?.data || []);
    } catch (err) {
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUsers = async () => {
    try {
      const res = await axios.get(
        `${baseUrl}/project-members/${project.id}/members`,
        getAuthHeaders()
      );
      setAssignedUsers(res?.data?.members?.data || []);
    } catch (err) {
      toast.error("Failed to load assigned users");
      setAssignedUsers([]);
    }
  };

  /* ASSIGN USER */
  const assignUser = async (userId) => {
    try {
      const res = await axios.post(
        `${baseUrl}/project-members/${project.id}/add-user`,
        { userId },
        getAuthHeaders()
      );

      toast.success("User assigned!");
      // Refresh the assigned users list from API
      fetchAssignedUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign user");
    }
  };

  /* CHECK ALREADY ASSIGNED */
  const isAssigned = (id) =>
    assignedUsers.some((u) => Number(u.id) === Number(id));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl w-full max-w-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">
          Assign Users to: {project?.name}
        </h2>

        {/* ASSIGNED USERS LIST */}
        <h3 className="text-lg font-semibold mt-3 mb-2">Assigned Users</h3>
        {assignedUsers.length === 0 ? (
          <p className="text-slate-400 mb-4">No users assigned yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {assignedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "/avatar.jpg"}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-slate-200 text-sm">{user.name}</div>
                    <div className="text-slate-400 text-xs">{user.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALL USERS LIST */}
        <h3 className="text-lg font-semibold mt-6 mb-2">All Users</h3>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "/avatar.jpg"}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-slate-200 text-sm">{user.name}</div>
                    <div className="text-slate-400 text-xs">{user.email}</div>
                  </div>
                </div>

                {isAssigned(user.id) ? (
                  <span className="text-green-400 text-sm">Assigned</span>
                ) : (
                  <button
                    onClick={() => assignUser(user.id)}
                    className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                  >
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex justify-end mt-6">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

