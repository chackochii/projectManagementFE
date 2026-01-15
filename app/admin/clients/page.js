"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function ClientPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    amount: "",
  });

  const [editClientData, setEditClientData] = useState(null); // for editing
  const [showEditModal, setShowEditModal] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // Load token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token") || "";
      setToken(t);
    }
  }, []);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch clients with billing
  useEffect(() => {
    if (token) fetchClients();
  }, [token]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/clients`, getAuthHeaders());
      const clientsData = res.data || [];

      // Fetch billing for each client
      const clientsWithBilling = await Promise.all(
        clientsData.map(async (c) => {
          try {
            const billingRes = await axios.get(
              `${baseUrl}/clients/${c.id}/billing`,
              getAuthHeaders()
            );
            return { ...c, billing: billingRes.data };
          } catch {
            return { ...c, billing: { totalHours: "00:00:00", projects: [] } };
          }
        })
      );

      setClients(clientsWithBilling);
    } catch (err) {
      console.error("Fetch clients error:", err);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  // Add client
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Adding client...", { id: "client" });
      await axios.post(`${baseUrl}/clients`, newClient, getAuthHeaders());
      toast.success("Client added successfully!", { id: "client" });
      setNewClient({ name: "", email: "", phone: "", address: "", amount: "" });
      fetchClients();
    } catch (err) {
      console.error("Add client error:", err);
      toast.error(err?.response?.data?.error || "Failed to add client", {
        id: "client",
      });
    }
  };

  // Edit client
  const handleEditClient = async () => {
    if (!editClientData) return;
    try {
      toast.loading("Updating client...", { id: "editClient" });
      await axios.put(
        `${baseUrl}/clients/${editClientData.id}`,
        editClientData,
        getAuthHeaders()
      );
      toast.success("Client updated!", { id: "editClient" });
      setShowEditModal(false);
      setEditClientData(null);
      fetchClients();
    } catch (err) {
      console.error("Edit client error:", err);
      toast.error(err?.response?.data?.error || "Failed to update client", {
        id: "editClient",
      });
    }
  };

  // Delete client
  const handleDeleteClient = async (clientId) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      toast.loading("Deleting client...", { id: "deleteClient" });
      await axios.delete(`${baseUrl}/clients/${clientId}`, getAuthHeaders());
      toast.success("Client deleted!", { id: "deleteClient" });
      fetchClients();
    } catch (err) {
      console.error("Delete client error:", err);
      toast.error(err?.response?.data?.error || "Failed to delete client", {
        id: "deleteClient",
      });
    }
  };

  if (loading)
    return <div className="text-white p-4">Loading clients and billing...</div>;

  return (
    <div className="p-4 md:p-6 text-white">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Client Management & Billing</h1>

      {/* Add Client Form */}
      <form
        onSubmit={handleAddClient}
        className="bg-slate-900 p-4 rounded-xl mb-6 border border-slate-700"
      >
        <h2 className="text-lg font-semibold mb-2">Add New Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Phone"
            value={newClient.phone}
            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Address"
            value={newClient.address}
            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newClient.amount}
            onChange={(e) => setNewClient({ ...newClient, amount: e.target.value })}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          Add Client
        </button>
      </form>

      {/* Clients List */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
        {clients.length === 0 && (
          <div className="text-slate-400 text-center py-4">No clients found.</div>
        )}

        {clients.map((c) => (
          <div
            key={c.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-semibold text-lg">{c.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditClientData(c);
                    setShowEditModal(true);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 rounded-full  px-3 py-1  text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClient(c.id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full  text-white text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="text-slate-300 text-sm mb-2">
              Email: {c.email || "-"} | Phone: {c.phone || "-"} | Amount: ₹
              {c.amount}
            </div>

            <span className="text-green-400 font-semibold">
              Total Hours: {c.billing?.totalHours || "00:00:00"}
            </span>

            {c.billing?.projects?.length > 0 && (
              <div className="mt-2">
                <h4 className="text-slate-400 font-semibold mb-1">Projects:</h4>
                <ul className="list-disc list-inside text-slate-300 text-sm">
                  {c.billing.projects.map((p) => (
                    <li key={p.projectId}>
                      {p.projectName}: {p.hours}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editClientData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Client</h2>

            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                placeholder="Name"
                value={editClientData.name}
                onChange={(e) =>
                  setEditClientData({ ...editClientData, name: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
              />
              <input
                type="email"
                placeholder="Email"
                value={editClientData.email}
                onChange={(e) =>
                  setEditClientData({ ...editClientData, email: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
              />
              <input
                type="text"
                placeholder="Phone"
                value={editClientData.phone}
                onChange={(e) =>
                  setEditClientData({ ...editClientData, phone: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
              />
              <input
                type="text"
                placeholder="Address"
                value={editClientData.address}
                onChange={(e) =>
                  setEditClientData({ ...editClientData, address: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
              />
              <input
                type="number"
                placeholder="Amount"
                value={editClientData.amount}
                onChange={(e) =>
                  setEditClientData({ ...editClientData, amount: e.target.value })
                }
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-full"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClient}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
