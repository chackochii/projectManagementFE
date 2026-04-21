"use client";

import axios from "axios";
import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FiClock, FiCheckCircle, FiLayers, FiLoader, FiTarget } from "react-icons/fi";

// --- Fixed Clock Component ---
const TimeDisplay = memo(() => {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-xl font-mono font-bold text-indigo-400">
      {time ? time : "00:00:00"}
    </span>
  );
});
TimeDisplay.displayName = "TimeDisplay";

// --- Stat Card Helper ---
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-slate-800 ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /* ---------------- STATE ---------------- */
  const [token, setToken] = useState(null);
  const isFetching = useRef(false);

  const [contributors, setContributors] = useState([]);
  const [issueStats, setIssueStats] = useState({
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    total: 0,
  });

  const COLORS = ["#60a5fa", "#fbbf24", "#a78bfa", "#34d399"];

  /* ---------------- TOKEN LOAD ---------------- */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) setToken(t);
  }, []);

  /* ---------------- MONTHLY REPORT ---------------- */
  const fetchMonthlyReport = useCallback(async () => {
    if (!token || isFetching.current) return;

    try {
      isFetching.current = true;
      const res = await axios.get(`${baseUrl}/tasks/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || {};
      const employees = Array.isArray(data.employees) ? data.employees : [];

      setContributors(
        employees.map((e) => ({
          name: e.employee || "Unknown",
          tasks: Number(e.totalTasks) || 0,
          hours: Number(e.hoursWorked) || 0,
        }))
      );

      const summary = data.summary || {};
      setIssueStats({
        todo: summary.todo || 0,
        inProgress: summary.inProgress || 0,
        review: summary.review || 0,
        done: summary.done || 0,
        total: summary.total ?? 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report");
    } finally {
      isFetching.current = false;
    }
  }, [token, baseUrl]);

  useEffect(() => {
    if (token) fetchMonthlyReport();
  }, [token, fetchMonthlyReport]);

  /* ---------------- MEMOIZED CHART DATA ---------------- */
  const pieData = useMemo(
    () => [
      { name: "To Do", value: issueStats.todo },
      { name: "In Progress", value: issueStats.inProgress },
      { name: "Review", value: issueStats.review },
      { name: "Done", value: issueStats.done },
    ],
    [issueStats]
  );

  return (
    <div className="p-4 md:p-8 bg-slate-750 min-h-screen text-slate-200">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time team performance & task metrics</p>
        </div>
        
        {/* TIME CARD - Aligned Top Right */}
        <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-[0.2em]">System Time</span>
            <TimeDisplay />
          </div>
          <div className="h-10 w-[1px] bg-slate-800 mx-2"></div>
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <FiClock size={20} />
          </div>
        </div>
      </div>

      {/* STATS ROW - Now horizontal and clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Tasks" value={issueStats.total} icon={FiLayers} colorClass="text-blue-400" />
        <StatCard title="To Do" value={issueStats.todo} icon={FiTarget} colorClass="text-slate-400" />
        <StatCard title="In Progress" value={issueStats.inProgress} icon={FiLoader} colorClass="text-amber-400" />
        <StatCard title="Review" value={issueStats.review} icon={FiLoader} colorClass="text-purple-400" />
        <StatCard title="Done" value={issueStats.done} icon={FiCheckCircle} colorClass="text-emerald-400" />
      </div>

      {/* CHARTS SECTION - Now taking more space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Contributor Progress</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full text tracking-tighter">Tasks per User</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                />
                <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Task Distribution</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full tracking-tighter">Current Status</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
