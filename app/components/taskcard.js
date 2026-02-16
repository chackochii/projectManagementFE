"use client";
import { Draggable } from "@hello-pangea/dnd";

function priorityColor(priority) {
  if (priority === "high") return "text-rose-400";
  if (priority === "medium") return "text-amber-400";
  return "text-sky-400";
}

// ✅ Generate initials
function getInitials(name) {
  if (!name || typeof name !== "string") return "?";

  const words = name.trim().split(" ").filter(Boolean);

  // Case 1: Multiple words → first letter of first two words
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Case 2: Single word → first two letters
  return words[0].slice(0, 2).toUpperCase();
}


// ✅ Generate background color based on name (consistent color)
function getColor(name) {
  const colors = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-sky-600",
    "bg-purple-600",
  ];

  // ✅ Fix: fallback if name is undefined/null
  if (!name || typeof name !== "string") {
    return "bg-slate-600";
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}


export default function TaskCard({ task, index }) {
  const initials = getInitials(task.assigneeName);
  const bgColor = getColor(task.assigneeName);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-700 flex items-center justify-between gap-3 ${
            snapshot.isDragging ? "scale-105" : ""
          }`}
        >
          <div className="flex-1">
            <div className="text-sm text-slate-200 mb-2">
              {task.title}
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full px-2 py-0.5 bg-slate-700 text-slate-100 text-xs">
                {task.id}
              </div>

              <div className={`text-xs ${priorityColor(task.priority)}`}>
                {task.priority}
              </div>
            </div>
          </div>

          {/* ✅ Initials Avatar */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${bgColor}`}
            title={task.assigneeName}
          >
            {initials}
          </div>
        </div>
      )}
    </Draggable>
  );
}
