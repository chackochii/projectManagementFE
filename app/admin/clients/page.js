"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {toast, Toaster} from "react-hot-toast";

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

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

useEffect(() => {
  if (!baseUrl) {
    console.error("API URL is missing!");
    toast.error("Server URL not configured");
  }
}, [baseUrl]);

if (!baseUrl) {
  return (
    <div className="p-4 text-red-400">
      Application misconfigured. Please contact support.
    </div>
  );
}


useEffect(() => {
  const controller = new AbortController();

  if (token) {
    fetchClients(controller.signal);
  }

  return () => controller.abort();
}, [token]);




  // Load token from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token") || "";
      setToken(t);
    }
  }, []);

  // useEffect(() => {
  //   if (token) fetchClients();
  // }, [token]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // GET /clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/clients`, { ...getAuthHeaders(),  timeout: 10000,});
      setClients(res.data || []);
    } catch (err) {
      console.error("Fetch clients error:", err);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  // POST /clients
  const handleAddClient = async (e) => {
    e.preventDefault();

    try {
      toast.loading("Adding client...", { id: "client" });

      const res = await axios.post(`${baseUrl}/clients`, newClient, { ...getAuthHeaders(),  timeout: 10000 });

      toast.success("Client added successfully!", { id: "client" });

      // Reset form
      setNewClient({ name: "", email: "", phone: "", address: "", amount: "" });

      // Reload list
      fetchClients();
    } catch (err) {
      console.error("Add client error:", err);

      toast.error(
        err?.response?.data?.error || "Failed to add client",
        { id: "client" }
      );
    }
  };

  if (loading) return <div className="text-white p-4">Loading clients...</div>;

  return (
    <div className="p-4 md:p-6 text-white">
        <Toaster position="top-right"/>
      <h1 className="text-2xl font-bold mb-4">Client Management</h1>

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

      {/* Client List */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
        <h2 className="text-lg font-semibold mb-2">Clients List</h2>

        {clients.length === 0 && !loading && (
  <div className="text-slate-400 text-center py-4">
    No clients found.
  </div>
)}

        {/* Mobile View */}
<div className="block md:hidden space-y-3">
  {clients.map((c) => (
    <div
      key={c.id}
      className="bg-slate-800 border border-slate-700 rounded-lg p-3"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">{c.id}</span>
        <span className="text-green-400 font-semibold">₹{c.amount}</span>
      </div>

      <div className="text-white font-semibold">{c.name}</div>

      {c.email && (
        <div className="text-sm text-slate-300 mt-1">{c.email}</div>
      )}

      {c.phone && (
        <div className="text-sm text-slate-300">{c.phone}</div>
      )}

      {c.address && (
        <div className="text-sm text-slate-400 mt-1">
          {c.address}
        </div>
      )}
    </div>
  ))}
</div>


      <div className="hidden md:block overflow-x-auto">
  <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Address</th>
              <th className="p-2">Amount</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-slate-800">
                <td className="p-2 text-slate-300">{c.id}</td>
                <td className="p-2 text-white">{c.name}</td>
                <td className="p-2 text-slate-300">{c.email}</td>
                <td className="p-2 text-slate-300">{c.phone}</td>
                <td className="p-2 text-slate-300">{c.address}</td>
                <td className="p-2 text-green-400 font-semibold">₹{c.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
