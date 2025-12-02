// app/lib/dummyData.js
export const initialColumns = [
  {
    id: "todo",
    title: "To Do",
    count: 3,
    tasks: [
      { id: "zen-4", title: "Fix layout issue on mobile view 4", priority: "high", avatar: "/avatar.jpg" },
      { id: "zen-8", title: "Fix layout issue on mobile view 8", priority: "low", avatar: "/avatar.jpg" },
      { id: "zen-12", title: "Fix layout issue on mobile view 12", priority: "medium", avatar: "/avatar.jpg" }
    ]
  },
  {
    id: "inprogress",
    title: "In Progress",
    count: 4,
    tasks: [
      { id: "zen-1", title: "Fix layout issue on mobile view 1", priority: "medium", avatar: "/avatar.jpg" },
      { id: "zen-5", title: "Fix layout issue on mobile view 5", priority: "high", avatar: "/avatar.jpg" },
    { id: "zen-13", title: "Fix layout issue on mobile view 13", priority: "low", avatar: "/avatar.jpg" }
    ]
  },
  {
    id: "review",
    title: "Review",
    count: 4,
    tasks: [
        { id: "zen-14", title: "Fix layout issue on mobile view 14", priority: "high", avatar: "/avatar.jpg" }
    ]
  },
  {
    id: "done",
    title: "Done",
    count: 4,
    tasks: [
       { id: "zen-7", title: "Fix layout issue on mobile view 7", priority: "medium", avatar: "/avatar.jpg" },
       { id: "zen-15", title: "Fix layout issue on mobile view 15", priority: "low", avatar: "/avatar.jpg" }
    ]
  }
];
