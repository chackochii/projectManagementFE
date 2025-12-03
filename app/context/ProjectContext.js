"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // ---- SAFE TOKEN LOAD ----
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("employeeToken");
      const userData = localStorage.getItem("employeeUser");

      if (t) setToken(t);
      if (userData) {
        try {
          setUserId(JSON.parse(userData)?.id || null);
        } catch (e) {
          console.error("Invalid employeeUser JSON");
        }
      }
    }
  }, []);

  // ---- SAFE AUTH HEADERS ----
  const getAuthHeaders = () => {
    if (!token) return {}; // prevent undefined headers during SSR/build
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ---- FETCH PROJECTS AFTER token + userId LOADED ----
  useEffect(() => {
    if (!token || !userId) return;

    const fetchProjectsForUser = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/project-members/user/${userId}/projects`,
          getAuthHeaders()
        );

        const userProjects = res.data.data || [];
        setProjects(userProjects);

        if (!currentProject && userProjects.length > 0) {
          setCurrentProject(userProjects[0]);
        }
      } catch (error) {
        console.error("Error loading user projects:", error);
      }
    };

    fetchProjectsForUser();
  }, [token, userId]); // wait until both exist

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
