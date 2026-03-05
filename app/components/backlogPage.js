'use client';
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Toaster, toast } from 'react-hot-toast';
import { useProject } from "../context/ProjectContext";

export default function BacklogPage() {
  const [currentSprintIssues, setCurrentSprintIssues] = useState([]);
  const [backlogIssues, setBacklogIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(null);
  const [isManager, setIsManager] = useState(false);


  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  // const hasFetched = useRef(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "task",
    assigneeId: null,
    projectId: currentProject?.id,
    estimatedTime: "",
  });

  // ---------------- LOAD TOKEN ----------------
useEffect(() => {
  if (typeof window !== "undefined") {
    const employeeToken = localStorage.getItem("employeeToken");
    const employeeUser = localStorage.getItem("employeeUser");

    if (employeeToken) setToken(employeeToken);

    if (employeeUser) {
      try {
        const user = JSON.parse(employeeUser);

        // check role
        if (user.role === "project_manager") {
          setIsManager(true);
        }
      } catch (err) {
        console.error("Invalid employeeUser JSON");
      }
    }
  }
}, []);


  // ---------------- SAFE FETCH FUNCTION WITH TIMEOUT ----------------
  const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await axios.get(url, { ...options, signal: controller.signal });
      return res.data;
    } catch (err) {
      console.error("Fetch failed:", err.message);
      return null;
    } finally {
      clearTimeout(id);
    }
  };

  // ---------------- FETCH BACKLOG + USERS ----------------
  const fetchBacklog = async () => {
    if (!token || !projectId) return;

    try {
      const data = await fetchWithTimeout(`${baseUrl}/tasks/backlog/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data) return;

      const formattedData = data.map((item) => ({
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
    } catch (err) {
      console.error("Error loading backlog:", err);
      toast.error("Failed to load backlog");
    }
  };

const fetchUsers = async () => {
  if (!token || !projectId) return;

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/project-members/${projectId}/members`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res?.success) return;

    // extract users correctly
    const members = res.members?.data || [];

    // optional: remove admin
    const filtered = members.filter((u) => u.role !== "admin");

    setUsers(filtered);

  } catch (err) {
    console.error("Error fetching project members:", err);
    toast.error("Failed to load project members");
  }
};



  useEffect(() => {
    if (token && projectId) {
      fetchBacklog();
      fetchUsers();
    }
  }, [token, projectId]);

  // ---------------- CREATE TASK ----------------
  const handleCreateIssue = async () => {
    if (!form.title) {
      toast.error("Title is required!");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${baseUrl}/tasks/`, {
        ...form,
        projectId: currentProject?.id || null,
      }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      await fetchBacklog();
      setIsModalOpen(false);
      setForm({ title: "", description: "", priority: "medium", type: "task", assigneeId: null, projectId, estimatedTime: "",});
      toast.success("Issue created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DRAG & DROP ----------------
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;

    if (sourceCol === destCol) return;

    const sourceItems = Array.from(sourceCol === "currentSprint" ? currentSprintIssues : backlogIssues);
    const destItems = Array.from(destCol === "currentSprint" ? currentSprintIssues : backlogIssues);

    const [movedItem] = sourceItems.splice(result.source.index, 1);
    destItems.splice(result.destination.index, 0, movedItem);

    if (sourceCol === "currentSprint") setCurrentSprintIssues(sourceItems);
    else setBacklogIssues(sourceItems);

    if (destCol === "currentSprint") setCurrentSprintIssues(destItems);
    else setBacklogIssues(destItems);
  };

  // ---------------- START SPRINT ----------------
  const handleStartSprint = async () => {
    if (currentSprintIssues.length === 0) {
      toast.error("No tasks in the current sprint to start!");
      return;
    }

     const unassignedTasks = currentSprintIssues.filter(
    (task) => !task.assigneeId
  );

  if (unassignedTasks.length > 0) {
    toast.error(
      `Please assign all tasks before starting the sprint. (${unassignedTasks.length} unassigned)`
    );
    return;
  }

    try {
      setLoading(true);
      await Promise.allSettled(currentSprintIssues.map((task) =>
        axios.patch(`${baseUrl}/tasks/status`, { id: task.id, status: "todo" }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
      ));

      setCurrentSprintIssues([]);
      await fetchBacklog();
      toast.success("Sprint started successfully!");
    } catch (err) {
      console.error("Error starting sprint:", err);
      toast.error("Failed to start sprint");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- ASSIGNEE HANDLERS ----------------
  const handleAssignUser = async () => {
    if (!selectedTask || !selectedAssignee) return;
    try {
      await axios.patch(`${baseUrl}/tasks/assign`, { taskId: selectedTask.id, assigneeId: selectedAssignee }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Task assigned successfully");
      await fetchBacklog();
      closeAssigneeModal();
    } catch (err) {
      toast.error("Failed to assign user");
    }
  };

  const handleUnassignUser = async () => {
    if (!selectedTask) return;
    try {
      await axios.patch(`${baseUrl}/tasks/unassign`, { taskId: selectedTask.id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Task unassigned successfully");
      await fetchBacklog();
      closeAssigneeModal();
    } catch (err) {
      toast.error("Failed to unassign user");
    }
  };

  const closeAssigneeModal = () => {
    setIsAssigneeModalOpen(false);
    setSelectedTask(null);
    setSelectedAssignee("");
  };
  const openAssigneeModal = (task) => {
  setSelectedTask(task);
  setIsAssigneeModalOpen(true);
};

  // ---------------- RENDER ----------------
  
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
      className="bg-[#0f172a] border border-[#243349] rounded-xl overflow-hidden"
    >
      {currentSprintIssues.length === 0 ? (
        <div className="text-gray-500 text-center py-10 border border-dashed border-gray-600 rounded-lg">
          Drag and drop here
        </div>
      ) : (
        <>
          {/* Desktop Header */}
          <div className="hidden md:grid md:grid-cols-6 bg-[#1e293b] text-gray-300 px-4 py-3 border-b border-[#243349]">
            <div>ID</div>
            <div>Title</div>
            <div>Description</div>
            <div>Priority</div>
            <div>Assignee</div>
            <div>Sprint</div>
          </div>

          {/* Rows */}
          {currentSprintIssues.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="border-b border-[#243349] hover:bg-[#1e293b] cursor-grab p-4 text-gray-300"
                >
                  {/* Mobile Card */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">
                        {task.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{task.id}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between">
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

                      <span className="text-sm text-blue-400">
                        {task.assigneeId ? task.name : "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Row */}
                  <div className="hidden md:grid md:grid-cols-6 md:px-4 md:py-3">
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
                    <div>
                      {task.assigneeId ? task.name : "Unassigned"}
                    </div>
                    <div>
                      {task.sprintId ? `Sprint ${task.sprintId}` : "Backlog"}
                    </div>
                  </div>
                </div>
              )}
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
      {/* Header */}
      <div className="hidden md:grid md:grid-cols-6 bg-[#1e293b] text-gray-300 px-4 py-3 border-b border-[#243349]">
        <div>ID</div>
        <div>Title</div>
        <div>Description</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Sprint</div>
      </div>

      {/* Rows */}
      {backlogIssues.map((task, index) => (
        <Draggable key={task.id} draggableId={task.id} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="border-b border-[#243349] hover:bg-[#1e293b] cursor-grab p-4 text-gray-300"
            >
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">
                    {task.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    #{task.id}
                  </span>
                </div>

                <p className="text-sm text-gray-400">
                  {task.description}
                </p>

                <div className="flex items-center justify-between">
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

                 <div
  onClick={() => openAssigneeModal(task)}
  className="text-blue-400 cursor-pointer hover:underline"
>
  {task.assigneeId ? task.name : "Unassigned"}
</div>

                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-6 md:px-4 md:py-3">
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
              <div
  onClick={() => openAssigneeModal(task)}
  className="text-blue-400 cursor-pointer hover:underline"
>
  {task.assigneeId ? task.name : "Unassigned"}
</div>

                <div>Backlog</div>
              </div>
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
          <div className="bg-[#0f172a] w-full max-w-lg mx-4 sm:mx-0 p-4 sm:p-6 rounded-xl border border-[#243349] shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-300 text-sm">Type</label>
                <select
                  className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 border border-[#243349]"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="rc">RC</option>
                </select>

                           {form.type === "rc" && (
  <div className="mt-4">
    <label className="text-gray-300 text-sm">
      Estimated Time (hours)
    </label>

    <input
      type="number"
      min="1"
      placeholder="e.g. 4"
      className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-1 border border-[#243349]"
      value={form.estimatedTime}
      onChange={(e) =>
        setForm({ ...form, estimatedTime: e.target.value })
      }
    />
  </div>
)}
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


      {isAssigneeModalOpen && selectedTask && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-[#0f172a] w-full max-w-md mx-4 sm:mx-0 p-4 sm:p-6 rounded-xl border border-[#243349] max-h-[90vh] overflow-y-auto">
      
      <h2 className="text-white text-lg font-semibold mb-4">
        Manage Assignee
      </h2>

      {/* If assigned → show Unassign */}
      {selectedTask.assigneeId ? (
        <>
          <p className="text-gray-300 mb-4">
            Currently assigned to <span className="text-white font-medium">
              {selectedTask.name}
            </span>
          </p>

          <button
            onClick={handleUnassignUser}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Unassign
          </button>
        </>
      ) : (
        <>
          <label className="text-gray-300 text-sm">Assign User</label>
          <select
            className="w-full bg-[#1e293b] text-white p-2 rounded-lg mt-2 border border-[#243349]"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || `User ${u.id}`}
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignUser}
            disabled={!selectedAssignee}
            className={`w-full mt-4 py-2 rounded-lg text-white
              ${
                selectedAssignee
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-400 cursor-not-allowed"
              }`}
          >
            Assign
          </button>
        </>
      )}

      <button
        onClick={closeAssigneeModal}
        className="w-full mt-3 text-gray-400 hover:text-white"
      >
        Cancel
      </button>
    </div>
  </div>
)}


    </div>
  );
}


// const TaskRow = ({ task, provided }) => (
//   <div
//     ref={provided.innerRef}
//     {...provided.draggableProps}
//     {...provided.dragHandleProps}
//     className="grid grid-cols-6 px-4 py-3 text-gray-300 hover:bg-[#1e293b] border-b border-[#243349] cursor-grab"
//   >
//     <div>{task.id}</div>
//     <div className="font-medium text-white">{task.title}</div>
//     <div>{task.description}</div>
//     <div>
//       <span
//         className={`px-2 py-1 rounded text-xs capitalize ${
//           task.priority === "high"
//             ? "bg-red-500/20 text-red-400"
//             : task.priority === "medium"
//             ? "bg-yellow-500/20 text-yellow-400"
//             : "bg-green-500/20 text-green-400"
//         }`}
//       >
//         {task.priority}
//       </span>
//     </div>
//     <div>User {task.assigneeId}</div>
//     <div>{task.sprintId ?? null}</div>
//   </div>
// );
