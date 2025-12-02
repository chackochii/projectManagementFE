"use client";
import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function EmployeeLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful!");
        localStorage.setItem("employeeToken", data.token);
        localStorage.setItem("employeeUser", JSON.stringify(data.user));
        // redirect to employee dashboard
        window.location.href = "/board";
      } else {
        toast.error(data.error || "Invalid credentials!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120]">
      <Toaster position="top-right" />
      <div className="bg-[#0f172a] p-8 rounded-xl w-[400px] border border-[#243349] shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Employee Login</h1>

        {/* Email */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">Email</label>
          <div className="flex items-center bg-[#1e293b] rounded-lg border border-[#243349] overflow-hidden">
            <span className="px-3 text-gray-400">
              <FiMail />
            </span>
            <input
              type="email"
              placeholder="your.email@example.com"
              className="w-full bg-transparent text-white p-2 outline-none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-1 block">Password</label>
          <div className="flex items-center bg-[#1e293b] rounded-lg border border-[#243349] overflow-hidden">
            <span className="px-3 text-gray-400">
              <FiLock />
            </span>
            <input
              type="password"
              placeholder="********"
              className="w-full bg-transparent text-white p-2 outline-none"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Forgot password? <a href="/employee/forgot-password" className="text-blue-500">Reset</a>
        </p>
      </div>
    </div>
  );
}
