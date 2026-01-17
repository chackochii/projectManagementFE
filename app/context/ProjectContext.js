"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const ProjectContext = createContext({
  projects: [],
  currentProject: null,
  setCurrentProject: () => {},
  loading: true,
  user: null,
  refreshUser: () => {}, // 1. Add this to context
});

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false); // Change initial to false
  const [user, setUser] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 2. Define fetch logic in a reusable way
  const fetchProjects = useCallback(async (userId, token) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${baseUrl}/project-members/user/${userId}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const userProjects = res.data.data || [];
      setProjects(userProjects);
      if (userProjects.length > 0) setCurrentProject(userProjects[0]);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  // 3. Create a refresh function that components can call manually
  const refreshUser = useCallback(() => {
    const storedUser = localStorage.getItem("employeeUser");
    const token = localStorage.getItem("employeeToken");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchProjects(parsedUser.id, token);
    } else {
      setLoading(false);
    }
  }, [fetchProjects]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <ProjectContext.Provider
      value={{ projects, currentProject, setCurrentProject, loading, user, refreshUser }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
