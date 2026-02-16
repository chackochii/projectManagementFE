"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";

const ProjectContext = createContext({
  projects: [],
  currentProject: null,
  setCurrentProject: () => {},
  loading: false,
  user: null,
  refreshUser: () => {},
});

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  // Use a ref to prevent infinite fetch loops
  const isFetching = useRef(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchProjects = useCallback(async (userId, token) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    try {
      const res = await axios.get(
        `${baseUrl}/project-members/user/${userId}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userProjects = res.data.data || [];
      
      // Optimization: Only update state if data actually changed
      // This prevents the entire app from re-rendering on every "refresh"
      setProjects((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(userProjects);
        return isSame ? prev : userProjects;
      });

      if (userProjects.length > 0) {
   setCurrentProject((prev) => {
  // If no previous project, select first
  if (!prev || !prev.id) {
    return userProjects[0];
  }

  // Ensure userProjects is valid array
  if (!Array.isArray(userProjects) || userProjects.length === 0) {
    return null;
  }

  // Check if previous project still exists
  const exists = userProjects.some(p => p && p.id === prev.id);

  return exists ? prev : userProjects[0];
});

      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [baseUrl]);

  const refreshUser = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const storedUser = localStorage.getItem("employeeUser");
    const token = localStorage.getItem("employeeToken");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      
      // Only update user state if the ID changed
      setUser(prev => (prev?.id === parsedUser.id ? prev : parsedUser));
      fetchProjects(parsedUser.id, token);
    }
  }, [fetchProjects]);

  // Initial load
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Crucial: Memoize the context value
  // This ensures components only re-render if the actual values change
  const contextValue = useMemo(() => ({
    projects,
    currentProject,
    setCurrentProject,
    loading,
    user,
    refreshUser
  }), [projects, currentProject, loading, user, refreshUser]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
