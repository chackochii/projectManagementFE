"use client";

import { Search, UserPlus, MoreVertical, Edit, Trash2, X } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

// --- Memoized Row Component to prevent table re-renders ---
const UserRow = memo(({ user, onEdit, onDelete, onStatusChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50 transition">
      <td className="p-4">{user.name}</td>
      <td className="p-4 text-slate-400">{user.email}</td>
      <td className="p-4">
        <span className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 text-sm">
          {user.role}
        </span>
      </td>
      <td className="p-4 text-slate-300">
  {user.hourlyRate ? `₹${user.hourlyRate}` : "-"}
</td>

<td className="p-4 text-slate-300">
  {user.monthlySalary ? `₹${user.monthlySalary}` : "-"}
</td>
      <td className="p-4">
        {user.status === "active" ? (
          <span className="px-2 py-1 bg-green-900/40 text-green-400 rounded-lg text-sm">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 bg-red-900/40 text-red-400 rounded-lg text-sm">
            Suspended
          </span>
        )}
      </td>
      <td className="p-4 text-right relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-2 hover:bg-slate-700 rounded-lg transition"
        >
          <MoreVertical size={18} className="text-slate-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-4 mt-2 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-110 text-left bottom-0 mb-0 origin-bottom-right ">
              <button
                className="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center gap-2"
                onClick={() => { onEdit(user); setMenuOpen(false); }}
              >
                <Edit size={16} /> Edit
              </button>
              <button
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/40 flex items-center gap-2"
                onClick={() => { onDelete(user.id); setMenuOpen(false); }}
              >
                <Trash2 size={16} /> Delete
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-slate-700"
                onClick={() => { onStatusChange(user.id, "active"); setMenuOpen(false); }}
              >
                Activate
              </button>
              <button
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/40"
                onClick={() => { onStatusChange(user.id, "suspended"); setMenuOpen(false); }}
              >
                Suspend
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
});
UserRow.displayName = "UserRow";

export default function UsersPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "developer",
    address: "", phone: "", identification: "",
    hourlyRate: "", monthlySalary: ""
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 1. SSR Safety & Token Check
  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem("token");
    if (!t) {
      window.location.href = "/admin";
    } else {
      setToken(t);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.filter(u => u.status !== "blocked"));
    } catch (err) {
      console.error(err);
    }
  }, [token, baseUrl]);

  useEffect(() => {
    if (mounted && token) fetchUsers();
  }, [mounted, token, fetchUsers]);

  // 2. Optimized Search (useMemo prevents filtering on form typing)
  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(query));
  }, [users, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = true;
    if (!form.email) newErrors.email = true;
    if (!form.password && !isEditMode) newErrors.password = true;
    if (!form.phone) newErrors.phone = true;
    if (!form.identification) newErrors.identification = true;
    if (!form.address) newErrors.address = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async () => {
  if (!validate()) return toast.error("Please fill all required fields!");

  try {
    if (isEditMode) {
      const payload = { ...form };

      if (!payload.password) {
        delete payload.password;
      }

      await axios.put(`${baseUrl}/users/${selectedUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User updated successfully!");
    } else {
      await axios.post(`${baseUrl}/users/register`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User created successfully!");
    }

    closeModal();
    fetchUsers();
  } catch (err) {
    toast.error(err.response?.data?.error || err.message);
  }
};


  const updateStatus = useCallback(async (id, status) => {
    try {
      await axios.post(`${baseUrl}/users/status`, { id, status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`User ${status === "active" ? "activated" : "suspended"}!`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  }, [token, baseUrl, fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${baseUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  }, [token, baseUrl, fetchUsers]);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setForm({
      name: user.name, email: user.email, password: "",
      role: user.role, address: user.address, phone: user.phone,
      identification: user.identification,
      hourlyRate: user.hourlyRate || "",
      monthlySalary: user.monthlySalary || ""
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUser(null);
    setErrors({});
    setForm({
      name: "", email: "", password: "", role: "developer",
      address: "", phone: "", identification: "",
      hourlyRate: "", monthlySalary: ""
    });
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="p-4 md:p-6 text-white min-h-screen">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Employees</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full mb-6">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-3 text-sm focus:outline-none focus:border-blue-500 transition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-slate-500 w-5 h-5" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border border-slate-800 rounded-xl ">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-4 border-b border-slate-800">Name</th>
              <th className="text-left p-4 border-b border-slate-800">Email</th>
              <th className="text-left p-4 border-b border-slate-800">Role</th>
              <th className="text-left p-4 border-b border-slate-800">Hourly Rate</th>
              <th className="text-left p-4 border-b border-slate-800">Monthly Salary</th>
              <th className="text-left p-4 border-b border-slate-800">Status</th>
              <th className="text-right p-4 border-b border-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onEdit={openEditModal}
                onDelete={deleteUser}
                onStatusChange={updateStatus}
              />
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p className="text-slate-500 text-sm mt-4 text-center">No users found.</p>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4 mt-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <span className={`text-sm ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {user.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
           <div className="mt-2 flex flex-col gap-1 text-sm text-slate-300">
  <span className="px-2 py-1 bg-slate-800 rounded-lg w-fit">
    {user.role}
  </span>

  <span>
    Hourly Rate: {user.hourlyRate ? `₹${user.hourlyRate}` : "-"}
  </span>

  <span>
    Monthly Salary: {user.monthlySalary ? `₹${user.monthlySalary}` : "-"}
  </span>
</div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => openEditModal(user)} className="px-3 py-1 bg-blue-600 rounded-lg text-sm flex items-center gap-1"><Edit size={14} /> Edit</button>
              <button onClick={() => deleteUser(user.id)} className="px-3 py-1 bg-red-600 rounded-lg text-sm flex items-center gap-1"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-lg border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? "Edit Employee" : "Add Employee"}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["name", "Name", "text"],
                ["email", "Email", "email"],
                ["password", "Password", "password"],
                ["phone", "Phone", "text"],
                ["identification", "Identification", "text"],
                ["address", "Address", "text"],
                ["hourlyRate", "Hourly Rate", "number"],
                ["monthlySalary", "Monthly Salary", "number"],

              ].map(([key, placeholder, type]) => (
                <input
                  key={key}
                  name={key}
                  type={type}
                  className={`input ${errors[key] ? "border-red-500" : ""}`}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={handleChange}
                  autoComplete="off"
                />
              ))}

              <select
                className="input"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          background: #0f172a;
          border: 1px solid #1e293b;
          padding: 10px;
          border-radius: 8px;
          color: white;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .input:focus {
          border-color: #2563eb;
        }
      `}</style>
    </div>
  );
}
