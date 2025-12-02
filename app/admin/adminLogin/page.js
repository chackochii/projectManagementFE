"use client";

import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleInput = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${baseUrl}/users/admin/login`,
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true }
      );

      const data = res.data;

      // Save token
      localStorage.setItem("token", data.token);

      toast.success("Login Successful!");
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.log("ERR:", err.response.status);

    if (err.response?.status == 401) {
      toast.error(err.response?.data?.error || "Invalid credentials");
      return;
    }

    toast.error(err.response?.data?.error || "Login Failed");
    } finally {
      setLoading(false);
    }
  };


  if (!baseUrl) return null;


  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white">
            Z
          </div>
          <h1 className="text-2xl font-bold mt-3 text-white">Admin Login</h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in to manage your workspace
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Email */}
          <div>
            <label className="text-slate-300 text-sm">Email</label>
            <div className="flex items-center mt-2 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <FiMail className="text-slate-400 mr-3" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInput}
                placeholder="admin@example.com"
                className="bg-transparent w-full text-white outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-slate-300 text-sm">Password</label>
            <div className="flex items-center mt-2 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <FiLock className="text-slate-400 mr-3" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleInput}
                placeholder="••••••••"
                className="bg-transparent w-full text-white outline-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Forgot password?{" "}
            <a
              href="#"
              className="text-violet-400 hover:text-violet-300 transition"
            >
              Reset here
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
