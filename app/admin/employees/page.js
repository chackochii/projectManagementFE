"use client";

import { Search, UserPlus, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "developer",
    address: "",
    phone: "",
    identification: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* LOAD TOKEN ONCE */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  /* FETCH USERS ONLY WHEN TOKEN EXISTS */
  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name) newErrors.name = true;
    if (!form.email) newErrors.email = true;
    if (!form.password) newErrors.password = true;
    if (!form.phone) newErrors.phone = true;
    if (!form.identification) newErrors.identification = true;
    if (!form.address) newErrors.address = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields!");
      return;
    }

    try {
      await axios.post(`${baseUrl}/users/register`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User created successfully!");
      setOpen(false);

      setForm({
        name: "",
        email: "",
        password: "",
        role: "developer",
        address: "",
        phone: "",
        identification: "",
      });

      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.post(
        `${baseUrl}/users/status`,
        { id, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`User ${status === "active" ? "activated" : "suspended"}!`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  /* CLOSE DROPDOWN ON OUTSIDE CLICK */
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Employees</h1>

        <button
          onClick={() => setOpen(true)}
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
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-3 text-sm focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-slate-500 w-5 h-5" />
      </div>

      {/* TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border border-slate-800 rounded-xl overflow-hidden">
          <thead className="bg-slate-900">
            <tr>
              <th className="text-left p-4 border-b border-slate-800">Name</th>
              <th className="text-left p-4 border-b border-slate-800">Email</th>
              <th className="text-left p-4 border-b border-slate-800">Role</th>
              <th className="text-left p-4 border-b border-slate-800">Status</th>
              <th className="text-right p-4 border-b border-slate-800"></th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="p-4">{user.name}</td>
                <td className="p-4 text-slate-400">{user.email}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 text-sm">
                    {user.role}
                  </span>
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
                  {/* ACTION MENU */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPos({ x: rect.right, y: rect.bottom });
                      setOpenMenuId(openMenuId === user.id ? null : user.id);
                    }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition"
                  >
                    <MoreVertical size={18} className="text-slate-400" />
                  </button>

                  {openMenuId === user.id && (
                    <div
                      className="fixed w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50"
                      style={{
                        top: dropdownPos.y,
                        left: dropdownPos.x - 160,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-slate-700"
                        onClick={() => {
                          updateStatus(user.id, "active");
                          setOpenMenuId(null);
                        }}
                      >
                        Activate
                      </button>

                      <button
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/40"
                        onClick={() => {
                          updateStatus(user.id, "suspended");
                          setOpenMenuId(null);
                        }}
                      >
                        Suspend
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="text-slate-500 text-sm mt-4">No users found.</p>
        )}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4 mt-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-slate-900 rounded-xl p-4 border border-slate-800"
            onClick={() => setSelectedUser(user)}
          >
            <div className="flex justify-between">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <MoreVertical className="text-slate-400" />
            </div>

            <p className="text-slate-400 text-sm mt-1">{user.email}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-slate-800 rounded-lg text-slate-300 text-sm">
                {user.role}
              </span>

              {user.status === "active" ? (
                <span className="px-2 py-1 bg-green-900/40 text-green-400 rounded-lg text-sm">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-red-900/40 text-red-400 rounded-lg text-sm">
                  Suspended
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD USER MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["name", "Name"],
                ["email", "Email"],
                ["password", "Password"],
                ["phone", "Phone"],
                ["identification", "Identification"],
                ["address", "Address"],
              ].map(([key, placeholder]) => (
                <input
                  key={key}
                  type={key === "password" ? "password" : "text"}
                  className={`input ${errors[key] ? "error" : ""}`}
                  name={key}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={handleChange}
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
              <button
                onClick={() => {
                  setOpen(false);
                  setErrors({});
                }}
                className="px-4 py-2 bg-slate-700 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-5 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-slate-900 w-full max-w-md rounded-xl p-6 shadow-xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Employee Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {[
                ["Name", selectedUser.name],
                ["Email", selectedUser.email],
                ["Role", selectedUser.role],
                ["Phone", selectedUser.phone],
                ["Address", selectedUser.address],
                ["Identification", selectedUser.identification],
                ["Status", selectedUser.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-slate-400 text-sm">{label}</p>
                  <p
                    className={`text-white font-medium ${
                      label === "Status"
                        ? value === "active"
                          ? "text-green-400"
                          : "text-red-400"
                        : ""
                    }`}
                  >
                    {value || "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                Close
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
        }
        .error {
          border-color: red;
        }
      `}</style>
    </div>
  );
}
