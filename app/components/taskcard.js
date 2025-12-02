// app/board/components/TaskCard.js
"use client";
import { Draggable } from "@hello-pangea/dnd";
import { FiCircle, FiCheckCircle } from "react-icons/fi";

function priorityColor(priority) {
  if (priority === "high") return "text-rose-400";
  if (priority === "medium") return "text-amber-400";
  return "text-sky-400";
}

export default function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-700 flex items-center justify-between gap-3 ${snapshot.isDragging ? "scale-105" : ""}`}
        >
          <div className="flex-1">
            <div className="text-sm text-slate-200 mb-2">{task.title}</div>
            <div className="flex items-center gap-3">
              <div className={`rounded-full px-2 py-0.5 bg-slate-700 text-slate-100 text-xs`}>{task.id}</div>
              <div className={`text-xs ${priorityColor(task.priority)}`}>{task.priority}</div>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img  src="/avatar.jpg" alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </Draggable>
  );
}
