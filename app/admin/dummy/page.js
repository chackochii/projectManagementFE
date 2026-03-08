"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ================= UI COMPONENTS ================= */

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-800 
      bg-[#0c1424] shadow-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function Title({ children }) {
  return (
    <h2 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-3">
      {children}
    </h2>
  );
}

function Field({ label, required = false, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="text-red-500 ml-1 text-[12px]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full h-11 rounded-lg border border-slate-700 px-4 text-sm
      bg-[#222a4a] text-white placeholder-slate-500
      focus:outline-none focus:ring-2 focus:ring-indigo-500
      disabled:opacity-50"
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full h-11 rounded-lg border border-slate-700 px-4 text-sm
      bg-[#222a4a] text-white
      focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {props.children}
    </select>
  );
}

/* ================= PAGE ================= */

export default function InvoicePage() {
  const [token, setToken] = useState(null);
  const [projects, setProjects] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    invoiceNo: "",
    projectId: "",
    startDate: "",
    endDate: "",
    ratePerHour: "",
    type: "rc",
  });

  /* ---------- INIT ---------- */

  useEffect(() => {
    const stored = localStorage.getItem("token");
    setToken(stored);
    setForm((prev) => ({
      ...prev,
      invoiceNo: `INV-${Date.now()}`,
    }));
  }, []);

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ---------- FETCH PROJECTS ---------- */

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.data || []);
    } catch (err) {
      console.error("Project fetch error:", err.response?.data);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchProjects();
  }, [token, fetchProjects]);

  /* ---------- FETCH INVOICE REPORT ---------- */

  const fetchInvoiceReport = useCallback(async () => {
    if (!form.projectId || !form.startDate || !form.endDate) return;

    try {
      setLoading(true);

      const res = await axios.get(`${baseUrl}/tasks/invoice-report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          projectId: form.projectId,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
        },
      });

      setReport(res.data);
    } catch (err) {
      console.error("Invoice report error:", err.response?.data);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [form, token]);

  useEffect(() => {
    fetchInvoiceReport();
  }, [form.projectId, form.type, form.startDate, form.endDate]);

  /* ---------- DERIVED VALUES ---------- */

  const selectedProject = useMemo(() => {
    return projects.find((p) => String(p.id) === String(form.projectId));
  }, [projects, form.projectId]);

 const totalHours = useMemo(() => {
  if (!report?.tasks?.length) return 0;

  return report.tasks.reduce(
    (sum, task) => sum + Number(task.estimatedTime || 0),
    0
  );
}, [report]);

  const totalAmount = useMemo(() => {
    if (!form.ratePerHour) return 0;
    return totalHours * Number(form.ratePerHour);
  }, [totalHours, form.ratePerHour]);




  // const exportInvoiceToPDF = () => {
  //   if (!report?.tasks || report.tasks.length === 0) {
  //     alert("No tasks found to generate invoice.");
  //     return;
  //   }

  //   const doc = new jsPDF({ unit: "pt", format: "a4" });

  //   // ---------- HELPERS ----------
  //   const formatDate = (dateString) => {
  //     if (!dateString) return "-";
  //     const date = new Date(dateString);
  //     const day = String(date.getDate()).padStart(2, "0");
  //     const month = String(date.getMonth() + 1).padStart(2, "0");
  //     const year = date.getFullYear();
  //     return `${day}-${month}-${year}`;
  //   };

  //   const billingDate = formatDate(new Date());
  //   const periodStart = formatDate(form.startDate);
  //   const periodEnd = formatDate(form.endDate);

  //   // =====================================================
  //   // HEADER BAR
  //   // =====================================================
  //   doc.setFillColor(15, 23, 42); // Dark Slate
  //   doc.rect(0, 0, 595, 80, "F");

  //   doc.setTextColor(255, 255, 255);
  //   doc.setFont("helvetica", "bold");
  //   doc.setFontSize(22);
  //   doc.text("TORTILLON TECHNOLOGY", 40, 45);

  //   doc.setFontSize(10);
  //   doc.setFont("helvetica", "normal");
  //   doc.text("INVOICE & WORK REPORT", 40, 62);

  //   // =====================================================
  //   // INVOICE METADATA (Aligned Right)
  //   // =====================================================
  //   doc.setTextColor(30, 30, 30);
  //   doc.setFontSize(10);
  //   doc.setFont("helvetica", "bold");
  //   doc.text("INVOICE NO:", 400, 110);
  //   doc.text("BILLING DATE:", 400, 125);
  //   doc.text("PERIOD:", 400, 140);

  //   doc.setFont("helvetica", "normal");
  //   doc.text(form.invoiceNo, 485, 110);
  //   doc.text(billingDate, 485, 125);
  //   doc.text(`${periodStart} to ${periodEnd}`, 485, 140);

  //   // =====================================================
  //   // PROJECT INFO (Aligned Left)
  //   // =====================================================
  //   doc.setFontSize(12);
  //   doc.setFont("helvetica", "bold");
  //   doc.text("BILL TO:", 40, 110);
    
  //   doc.setFontSize(16);
  //   doc.setTextColor(79, 70, 229); // Indigo color
  //   doc.text(selectedProject?.name || "N/A", 40, 130);

  //   doc.setFontSize(10);
  //   doc.setTextColor(100);
  //   doc.setFont("helvetica", "normal");
  //   doc.text(`Task Type: ${form.type.toUpperCase()}`, 40, 145);

  //   // =====================================================
  //   // SUMMARY CARDS
  //   // =====================================================
  //   const cardY = 170;
  //   const drawSummaryCard = (x, title, value, isTotal = false) => {
  //     doc.setDrawColor(230);
  //     doc.setFillColor(isTotal ? 249 : 255, isTotal ? 250 : 255, isTotal ? 251 : 255);
  //     doc.roundedRect(x, cardY, 165, 60, 5, 5, "FD");

  //     doc.setFontSize(9);
  //     doc.setTextColor(120);
  //     doc.setFont("helvetica", "normal");
  //     doc.text(title, x + 15, cardY + 22);

  //     doc.setFontSize(14);
  //     doc.setFont("helvetica", "bold");
  //     doc.setTextColor(isTotal ? 79 : 20, isTotal ? 70 : 20, isTotal ? 229 : 20);
  //     doc.text(value, x + 15, cardY + 45);
  //   };

  //   drawSummaryCard(40, "Total Hours", `${totalHours.toFixed(2)} Hrs`);
  //   drawSummaryCard(215, "Rate Per Hour", `INR ${form.ratePerHour}`);
  //   drawSummaryCard(390, "Total Amount", `INR ${totalAmount.toLocaleString("en-IN")}`, true);

  //   // =====================================================
  //   // WORK LOG TABLE
  //   // =====================================================
  //   const tableColumns = ["#", "Task Description", "Assignee", "Hours"];
  //   const tableRows = report.tasks.map((task, index) => [
  //     index + 1,
  //     task.title,
  //     task.assignee || "Unassigned",
  //     `${task.estimatedTime.toFixed(2)} hrs`,
  //   ]);

  //   autoTable(doc, {
  //     head: [tableColumns],
  //     body: tableRows,
  //     startY: cardY + 85,
  //     theme: "striped",
  //     styles: { fontSize: 9, cellPadding: 8 },
  //     headStyles: { 
  //       fillColor: [15, 23, 42], 
  //       textColor: 255, 
  //       fontStyle: "bold",
  //       halign: "center" 
  //     },
  //     columnStyles: {
  //       0: { halign: "center", cellWidth: 30 },
  //       1: { cellWidth: "auto" },
  //       2: { halign: "center", cellWidth: 100 },
  //       3: { halign: "right", cellWidth: 80 },
  //     },
  //     margin: { left: 40, right: 40 },
  //   });

  //   // =====================================================
  //   // FOOTER
  //   // =====================================================
  //   const finalY = doc.lastAutoTable.finalY + 30;
    
  //   doc.setDrawColor(200);
  //   doc.line(40, finalY, 555, finalY);

  //   doc.setFontSize(10);
  //   doc.setTextColor(150);
  //   doc.text("Thank you for your business!", 40, finalY + 20);
    
  //   doc.setFont("helvetica", "bold");
  //   doc.setTextColor(30);
  //   doc.text("Authorized Signature", 440, finalY + 20);
  //   doc.line(430, finalY + 45, 555, finalY + 45);

  //   // SAVE PDF
  //   doc.save(`Invoice_${form.invoiceNo}_${selectedProject?.name}.pdf`);
  // };

const exportInvoiceToPDF = () => {
  console.log("Export started...");

  // 1. Check if report exists
  if (!report || !report.tasks || report.tasks.length === 0) {
    console.error("No tasks found in report");
    alert("No tasks found to generate invoice.");
    return;
  }

  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Improved Date Helper to prevent crashes
    const formatDate = (dateString) => {
      const date = dateString ? new Date(dateString) : new Date();
      if (isNaN(date.getTime())) return "N/A";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const billingDate = formatDate(new Date());
    const periodStart = formatDate(form.startDate);
    const periodEnd = formatDate(form.endDate);

    console.log("Dates formatted:", { billingDate, periodStart, periodEnd });

    // HEADER BAR
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 595, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TORTILLON TECHNOLOGY", 40, 45);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE & WORK REPORT", 40, 62);

    // INVOICE METADATA
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE NO:", 400, 110);
    doc.text("BILLING DATE:", 400, 125);
    doc.text("PERIOD:", 400, 140);
    doc.setFont("helvetica", "normal");
    doc.text(String(form.invoiceNo), 485, 110);
    doc.text(billingDate, 485, 125);
    doc.text(`${periodStart} to ${periodEnd}`, 485, 140);

    // PROJECT INFO
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 40, 110);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(selectedProject?.name || "Client Name", 40, 130);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Task Type: ${form.type.toUpperCase()}`, 40, 145);

    // SUMMARY CARDS
    const cardY = 170;
    const drawSummaryCard = (x, title, value, isTotal = false) => {
      doc.setDrawColor(230);
      doc.setFillColor(isTotal ? 249 : 255, isTotal ? 250 : 255, isTotal ? 251 : 255);
      doc.roundedRect(x, cardY, 165, 60, 5, 5, "FD");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(title, x + 15, cardY + 22);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isTotal ? 79 : 20, isTotal ? 70 : 20, isTotal ? 229 : 20);
      doc.text(value, x + 15, cardY + 45);
    };

    drawSummaryCard(40, "Total Hours", `${totalHours.toFixed(2)} Hrs`);
    drawSummaryCard(215, "Rate Per Hour", `INR ${form.ratePerHour || 0}`);
    drawSummaryCard(390, "Total Amount", `INR ${totalAmount.toLocaleString("en-IN")}`, true);

    // TABLE
    console.log("Generating table...");
    const tableColumns = ["ID", "Task Description", "Assignee", "Hours"];
    const tableRows = report.tasks.map((task, index) => [
      index + 1,
      task.title,
      task.assignee || "Unassigned",
      `${Number(task.estimatedTime).toFixed(2)} hrs`,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: cardY + 85,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], halign: "center" },
      columnStyles: {
        0: { halign: "center", cellWidth: 30 },
        3: { halign: "right", cellWidth: 80 },
      },
      margin: { left: 40, right: 40 },
    });

    // FOOTER
    const finalY = doc.lastAutoTable.finalY + 40;
    doc.setDrawColor(200);
    doc.line(40, finalY, 555, finalY);
    doc.text("Thank you for your business!", 40, finalY + 20);

    console.log("Saving PDF...");
    doc.save(`Invoice_${form.invoiceNo}.pdf`);
    
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
};
  /* ================= UI ================= */

  return (
    <div className="p-8 min-h-screen bg-slate-900  text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Invoice Generator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate invoices from completed tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <Title>Invoice Details</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Invoice Number">
                  <Input value={form.invoiceNo} disabled />
                </Field>

                <Field label="Project">
                 <Select
  required
  value={form.projectId}
  onChange={(e) =>
    update("projectId", e.target.value)
  }
  className={`w-full h-11 rounded-lg border px-4 text-sm
    bg-[#0b0f1a] text-white
    focus:outline-none focus:ring-2 focus:ring-indigo-500
    ${!form.projectId ? "border-red-500" : "border-slate-700"}`}
>
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Task Type">
                  <Select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                  >
                    <option value="rc">CR</option>
                    {/* <option value="task">Regular Task</option>
                    <option value="bug">Bug Fix</option> */}
                  </Select>
                </Field>

                <Field label="Rate per Hour (₹)">
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={form.ratePerHour}
                    onChange={(e) =>
                      update("ratePerHour", e.target.value)
                    }
                  />
                </Field>

                <Field label="Start Date" required>
  <Input
    type="date"
    required
    value={form.startDate}
    onChange={(e) => update("startDate", e.target.value)}
    className={`w-full h-11 rounded-lg border px-4 text-sm
      bg-[#1b2951]
      focus:outline-none focus:ring-2 focus:ring-indigo-500
      ${form.startDate ? "border-slate-700 text-white" : "border-red-500 text-slate-400"}`}
  />
</Field>

            <Field label="End Date" required>
  <Input
    type="date"
    required
    value={form.endDate}
    onChange={(e) => update("endDate", e.target.value)}
    className={`w-full h-11 rounded-lg border px-4 text-sm
      bg-[#1b2951]
      focus:outline-none focus:ring-2 focus:ring-indigo-500
      ${form.endDate ? "border-slate-700 text-white" : "border-red-500 text-slate-400"}`}
  />
</Field>
              </div>
            </Card>

            <Card>
              <Title>Work Log</Title>

              {loading ? (
                <div className="py-12 text-center text-slate-500 animate-pulse">
                  Fetching logs...
                </div>
              ) : report?.tasks?.length ? (
                <div className="space-y-3">
                  {report.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex justify-between items-center p-4 border border-slate-800 rounded-lg bg-[#0b0f1a]"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {task.assignee}
                        </div>
                      </div>
                      <div className="text-indigo-400 font-bold">
                        {task.estimatedTime.toFixed(2)} hrs
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  No completed tasks found.
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="lg:sticky lg:top-8 h-fit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl p-8 space-y-6"
            >
              <h2 className="text-xl font-bold border-b border-white/20 pb-4">
                Invoice Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Project:</span>
                  <span className="font-bold">
                    {selectedProject?.name || "None"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Total Hours:</span>
                  <span className="font-mono font-bold">
                    {totalHours.toFixed(2)} hrs
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Hourly Rate:</span>
                  <span className="font-mono font-bold">
                    ₹{form.ratePerHour || 0}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/20">
                <div className="text-xs uppercase tracking-widest">
                  Total Amount
                </div>
                <div className="text-4xl font-black">
                  ₹ {totalAmount.toLocaleString("en-IN")}
                </div>
              </div>

              <button
                onClick={exportInvoiceToPDF}
                disabled={!form.projectId || totalAmount === 0}
                className="w-full py-4 rounded-xl bg-white text-indigo-700 font-bold
                hover:bg-slate-100 transition disabled:opacity-50"
              >
                Generate Invoice
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
