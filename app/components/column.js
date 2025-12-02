// app/board/components/Column.js
"use client";
import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "../components/taskcard.js";

export default function Column({ column }) {
  return (
    <div className="w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{column.title}</h3>
        <div className="text-slate-400">{column.tasks.length}</div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[6rem] space-y-4 p-3 rounded-lg ${snapshot.isDraggingOver ? "bg-slate-800" : "bg-slate-900"}`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
