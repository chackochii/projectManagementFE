"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  useEffect(() => {
    const fetchProjectsForUser = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("employeeUser")); // { id, email, name, ... }

        if (!userData?.id) {
          console.error("No user ID found.");
          return;
        }

        const res = await axios.get(
          `${baseUrl}/project-members/user/${userData.id}/projects`,
          getAuthHeaders()
        );

        const userProjects = res.data.data || [];

        setProjects(userProjects);

        // Auto-select first project if none selected
        if (!currentProject && userProjects.length > 0) {
          setCurrentProject(userProjects[0]);
        }

      } catch (error) {
        console.error("Error loading user projects:", error);
      }
    };

    fetchProjectsForUser();
  }, []); // Only runs once

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
