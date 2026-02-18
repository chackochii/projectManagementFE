"use client";

import { useState, useCallback } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useProject } from "../context/ProjectContext";

export default function EmployeeLoginPage() {
  const { refreshUser } = useProject();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  const handleLogin = useCallback(async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!API_BASE_URL) {
      toast.error("API configuration missing");
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data = null;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Login failed");
      }

      toast.success("Login successful");

      if (typeof window !== "undefined") {
        localStorage.setItem("employeeToken", data.token);
        localStorage.setItem("employeeUser", JSON.stringify(data.user));
        refreshUser();
      }

      router.push("/board");
    } catch (err) {
      if (err.name === "AbortError") {
        toast.error("Request timed out. Server not responding.");
      } else {
        toast.error(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }, [form, API_BASE_URL, refreshUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1120] px-4 sm:px-6">
      <Toaster position="top-right" />

      <div className="w-full max-w-md bg-[#0f172a] p-6 sm:p-8 rounded-xl border border-[#243349] shadow-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          Employee Login
        </h1>

        {/* Email */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">Email</label>
          <div className="flex items-center bg-[#1e293b] rounded-lg border border-[#243349]">
            <span className="px-3 text-gray-400 text-lg">
              <FiMail />
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder="your.email@example.com"
              className="w-full bg-transparent text-white p-3 sm:p-2 outline-none text-sm sm:text-base"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-1 block">Password</label>
          <div className="flex items-center bg-[#1e293b] rounded-lg border border-[#243349]">
            <span className="px-3 text-gray-400 text-lg">
              <FiLock />
            </span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="********"
              className="w-full bg-transparent text-white p-3 sm:p-2 outline-none text-sm sm:text-base"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-3 sm:py-2 px-4 rounded-lg text-white font-semibold transition text-sm sm:text-base ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-gray-500 text-xs sm:text-sm mt-4 text-center">
          Forgot password?{" "}
          <a
            href="/employee/forgot-password"
            className="text-blue-500 hover:underline"
          >
            Reset
          </a>
        </p>
      </div>
    </div>
  );
}
