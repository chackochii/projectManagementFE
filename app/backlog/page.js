'use client';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Toaster, toast } from 'react-hot-toast';
import { useProject } from "../context/ProjectContext";




export default function BacklogPage() {
  const [currentSprintIssues, setCurrentSprintIssues] = useState([]);
  const [backlogIssues, setBacklogIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    const token = localStorage.getItem("employeeToken");

const { currentProject } = useProject();
const projectId = currentProject?.id;
console.log("Current Project ID in BacklogPage:", projectId);



  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "task",
    assigneeId: null,
    projectId: currentProject?.id,
  });

  // Fetch backlog
const fetchBacklog = async () => {
  //  if (!projectId) return;
  try {
  const res = await axios.get(
      `${baseUrl}/tasks/backlog/${projectId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const formattedData = res.data.map((item) => ({
      id: String(item.id),
      title: item.title,
      description: item.description,
      code: item.code || "task-" + item.id,
      icon: "📌",
      priority: item.priority,
      avatar: "https://i.pravatar.cc/40?img=" + item.id,
      assigneeId: item.assigneeId,
      name: item.name || `User ${item.assigneeId}`,
      sprintId: item.sprintId || "backlog",
    }));

    setBacklogIssues(formattedData);
  } catch (error) {
    console.error("Error loading backlog:", error);
  }
};

const handleCreateIssue = async () => {
  const token = localStorage.getItem("employeeToken"); // get token here

  if (!form.title) {
    toast.error("Title is required!");
    return;
  }

  try {
    setLoading(true);

    // Ensure projectId is always set
    const payload = {
      ...form,
      projectId: currentProject?.id || null,
    };

    await axios.post(`${baseUrl}/tasks/`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    await fetchBacklog();

    setIsModalOpen(false);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      type: "task",
      assigneeId: null,
      projectId: currentProject?.id,
    });

    toast.success("Issue created successfully!");
  } catch (error) {
    console.error("Error creating task:", error);
    toast.error("Failed to create task. Check all fields");
  } finally {
    setLoading(false);
  }
};


const fetchUsers = async () => {
  try {
    const res = await axios.get(`${baseUrl}/users/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("employeeToken")}` }
    });

    const filtered = res.data.filter((u) => u.role !== "admin");

    setUsers(filtered);

  } catch (error) {
    console.error("Error fetching users:", error);
  }
};



useEffect(() => {
  fetchBacklog();
   fetchUsers(); 
}, [projectId]); // Refetch when projectId changes



  // Drag + Drop
const onDragEnd = (result) => {
  if (!result.destination) return;

  const sourceCol = result.source.droppableId;
  const destCol = result.destination.droppableId;

  // Prevent dragging within the same column
  if (sourceCol === destCol) return;

  const sourceItems = Array.from(
    sourceCol === "currentSprint" ? currentSprintIssues : backlogIssues
  );
  const destItems = Array.from(
    destCol === "currentSprint" ? currentSprintIssues : backlogIssues
  );

  const [movedItem] = sourceItems.splice(result.source.index, 1);
  destItems.splice(result.destination.index, 0, movedItem);

  if (sourceCol === "currentSprint") setCurrentSprintIssues(sourceItems);
  else setBacklogIssues(sourceItems);

  if (destCol === "currentSprint") setCurrentSprintIssues(destItems);
  else setBacklogIssues(destItems);
};



const handleStartSprint = async () => {
  if (currentSprintIssues.length === 0) {
    toast.error("No tasks in the current sprint to start!");
    return;
  }

  try {
    setLoading(true); // start loader

    // Update status in backend with token
    await Promise.all(
      currentSprintIssues.map((task) =>
        axios.patch(
          `${baseUrl}/tasks/status`,
          {
            id: task.id,
            status: "todo",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`, // add your token here
              "Content-Type": "application/json",
            },
          }
        )
      )
    );

    // Clear current sprint section
    setCurrentSprintIssues([]);

    // Refresh backlog
    await fetchBacklog();

    toast.success("Sprint started successfully!"); // success toast
  } catch (error) {
    console.error("Error starting sprint:", error);
    toast.error("Failed to start sprint."); // failure toast
  } finally {
    setLoading(false); // stop loader
  }
};





  // Issue Card for sprint
  // const IssueCard = ({ issue, provided }) => (
  //   <div
  //     ref={provided.innerRef}
  //     {...provided.draggableProps}
  //     {...provided.dragHandleProps}
  //     className="flex justify-between items-center bg-[#0f172a] hover:bg-[#1e293b] text-white p-4 rounded-xl mb-2 border border-[#243349] transition"
  //   >
  //     <div className="flex items-center gap-3">
  //       <span className="text-xl">{issue.icon}</span>
  //       <div>
  //         <p className="font-medium">{issue.title}</p>
  //         <span className="text-sm text-gray-400">{issue.code}</span>
  //       </div>
  //     </div>
  //     <img src={issue.avatar} className="w-8 h-8 rounded-full border border-gray-600" />
  //   </div>
  // );

  return (
    <div className="min-h-screen bg-[#0b1120] px-8 py-6">
       <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold">Backlog</h1>
          <p className="text-gray-400">Plan your sprints and manage your project issues.</p>
        </div>
      </div>

      {/* DRAG DROP CONTEXT */}
      <DragDropContext onDragEnd={onDragEnd}>

        {/* CURRENT SPRINT */}
        <div className="bg-[#0f172a] border border-[#243349] rounded-xl p-5 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-semibold">
              Current Sprint ({currentSprintIssues.length})
            </h2>
           <button
  onClick={handleStartSprint}
  disabled={loading}
  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg ${
    loading ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  {loading ? "Starting..." : "Start Sprint"}
</button>
          </div>

          <Droppable droppableId="currentSprint">
  {(provided) => (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className="min-h-[150px] bg-[#0f172a] border border-[#243349] rounded-xl overflow-hidden"
    >
      {currentSprintIssues.length === 0 ? (
        <div className="text-gray-500 text-center py-10 border border-dashed border-gray-600 rounded-lg">
          Drag and drop here
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-6 bg-[#1e293b] text-gray-300 px-4 py-3 border-b border-[#243349]">
            <div>ID</div>
            <div>Title</div>
            <div>Description</div>
            <div>Priority</div>
            <div>Assignee</div>
            <div>Sprint</div>
          </div>

          {/* Table Rows */}
          {currentSprintIssues.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided) => <TaskRow task={task} provided={provided} />}
            </Draggable>
          ))}
        </>
      )}
      {provided.placeholder}
    </div>
  )}
</Droppable>

        </div>

        {/* BACKLOG SECTION */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-semibold">
            Backlog ({backlogIssues.length})
          </h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            +
            <span>Create Task</span>
          </button>
        </div>

        <Droppable droppableId="backlog">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-[#0f172a] border border-[#243349] rounded-xl overflow-hidden"
            >

              {/* Table Header */}
              <div className="grid grid-cols-6 bg-[#1e293b] text-gray-300 px-4 py-3 border-b border-[#243349]">
                <div>ID</div>
                <div>Title</div>
                <div>Description</div>
                <div>Priority</div>
                <div>Assignee</div>
                <div>Sprint</div>
              </div>

              {/* Table Rows */}
              {backlogIssues.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="grid grid-cols-6 px-4 py-3 text-gray-300 hover:bg-[#1e293b] border-b border-[#243349] cursor-grab"
                    >
                      <div>{task.id}</div>
                      <div className="font-medium text-white">{task.title}</div>
                      <div>{task.description}</div>

                      <div>
                        <span
                          className={`px-2 py-1 rounded text-xs capitalize ${
                            task.priority === "high"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div>{task.name}</div>
                      <div>Sprint {task.sprintId}</div>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* CREATE ISSUE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0f172a] p-6 rounded-xl w-[500px] border border-[#243349] shadow-xl animate-fadeIn">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-semibold">Create Issue</h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* TITLE */}
            <label className="text-gray-300 text-sm">Title</label>
            <input
              className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 mb-4 outline-none border border-[#243349]"
              placeholder="e.g. Fix login button"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            {/* DESCRIPTION */}
            <label className="text-gray-300 text-sm">Description</label>
            <textarea
              className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 mb-4 outline-none border border-[#243349] h-28"
              placeholder="Describe the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* TYPE + PRIORITY */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm">Type</label>
                <select
                  className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 border border-[#243349]"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="story">Story</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 text-sm">Priority</label>
                <select
                  className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 border border-[#243349]"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* ASSIGNEE */}
      <label className="text-gray-300 text-sm mt-4 block">Assignee</label>
<select
  className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 border border-[#243349]"
  value={form.assigneeId || ""}
  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
>
  <option value="">Unassigned</option>

  {users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.name || `User ${user.id}`}
    </option>
  ))}
</select>


            {/* FOOTER */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>

             <button
  onClick={handleCreateIssue}
  disabled={loading}
  className={`px-4 py-2 rounded-lg text-white
    ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
  `}
>
  {loading ? "Creating Task..." : "Create Task"}
</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


const TaskRow = ({ task, provided }) => (
  <div
    ref={provided.innerRef}
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    className="grid grid-cols-6 px-4 py-3 text-gray-300 hover:bg-[#1e293b] border-b border-[#243349] cursor-grab"
  >
    <div>{task.id}</div>
    <div className="font-medium text-white">{task.title}</div>
    <div>{task.description}</div>
    <div>
      <span
        className={`px-2 py-1 rounded text-xs capitalize ${
          task.priority === "high"
            ? "bg-red-500/20 text-red-400"
            : task.priority === "medium"
            ? "bg-yellow-500/20 text-yellow-400"
            : "bg-green-500/20 text-green-400"
        }`}
      >
        {task.priority}
      </span>
    </div>
    <div>User {task.assigneeId}</div>
    <div>{task.sprintId ? `Sprint ${task.sprintId}` : "Backlog"}</div>
  </div>
);
