import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function AssignUsersModal({ project, closeModal, refreshProjects }) {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchUsers();

    // Pre-select already assigned users
    setSelectedUsers(project.users?.map((u) => u.id) || []);
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      if (!token) {
        window.location.href = "/admin";
        return;
      }

      const res = await axios.get(`${baseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data.data);
    } catch (err) {
      toast.error("Failed to load users");
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("employeeToken");

      await axios.post(
        `${baseUrl}/projects/${project.id}/assign-users`,
        { users: selectedUsers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Users assigned successfully!");
      refreshProjects();
      closeModal();
    } catch (err) {
      toast.error("Failed to assign users");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-slate-900 p-6 rounded-xl w-full max-w-lg border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">
          Assign Users to {project.name}
        </h2>

        <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-700 p-3 rounded">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes(u.id)}
                onChange={() => toggleUser(u.id)}
              />
              <span>{u.name}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
