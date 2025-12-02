export const mockUsers = [
  { id: "u1", name: "Edwin" },
  { id: "u2", name: "Jerin" },
  { id: "u3", name: "Alen" },
];

export const workReport = {
  u1: {
    tasks: [
      { name: "Completed", value: 12 },
      { name: "In Progress", value: 5 },
      { name: "Pending", value: 3 },
      { name: "Bugs", value: 2 },
    ],
    hours: [
      { project: "Project A", hours: 9 },
      { project: "Project B", hours: 14 },
      { project: "Project C", hours: 6 },
    ],
  },

  u2: {
    tasks: [
      { name: "Completed", value: 7 },
      { name: "In Progress", value: 4 },
      { name: "Pending", value: 1 },
      { name: "Bugs", value: 1 },
    ],
    hours: [
      { project: "Project A", hours: 5 },
      { project: "Project X", hours: 11 },
    ],
  },

  u3: {
    tasks: [
      { name: "Completed", value: 4 },
      { name: "In Progress", value: 6 },
      { name: "Pending", value: 2 },
      { name: "Bugs", value: 0 },
    ],
    hours: [
      { project: "Project C", hours: 8 },
      { project: "Website", hours: 7 },
    ],
  },
};
