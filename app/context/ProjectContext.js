"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  const [currentProject, setCurrentProjectState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const isFetching = useRef(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // ✅ Wrapped setter to ALSO save to localStorage
  const setCurrentProject = useCallback((project) => {
    if (!project) return;

    setCurrentProjectState(project);

    localStorage.setItem(
      "currentProjectId",
      project.id.toString()
    );
  }, []);

  // ✅ Fetch Projects
  const fetchProjects = useCallback(async (userId, token) => {
    if (isFetching.current) return;

    isFetching.current = true;
    setLoading(true);

    try {
      const res = await axios.get(
        `${baseUrl}/project-members/user/${userId}/projects`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userProjects = res.data.data || [];

      setProjects((prev) => {
        const isSame =
          JSON.stringify(prev) === JSON.stringify(userProjects);
        return isSame ? prev : userProjects;
      });

      // ✅ Restore project from localStorage FIRST
      const savedProjectId =
        typeof window !== "undefined"
          ? localStorage.getItem("currentProjectId")
          : null;

      let projectToSet = null;

      if (savedProjectId) {
        projectToSet = userProjects.find(
          (p) => p.id.toString() === savedProjectId
        );
      }

      // fallback to first project
      if (!projectToSet && userProjects.length > 0) {
        projectToSet = userProjects[0];
      }

      if (projectToSet) {
        setCurrentProjectState(projectToSet);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [baseUrl]);

  // ✅ Refresh user and fetch projects
  const refreshUser = useCallback(() => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("employeeUser");
    const token = localStorage.getItem("employeeToken");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);

      setUser((prev) =>
        prev?.id === parsedUser.id ? prev : parsedUser
      );

      fetchProjects(parsedUser.id, token);
    }
  }, [fetchProjects]);

  // ✅ Initial load
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ✅ Context value memoized
  const contextValue = useMemo(
    () => ({
      projects,
      currentProject,
      setCurrentProject,
      loading,
      user,
      refreshUser,
    }),
    [
      projects,
      currentProject,
      setCurrentProject,
      loading,
      user,
      refreshUser,
    ]
  );

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
