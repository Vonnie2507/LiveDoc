import React, { createContext, useState, useContext } from 'react';
import { apiClient } from '../utils/apiClient';
import { Project } from '../types/models';
import { User } from '../types/models';

interface ProjectContextType {
  activeProject: Project | null;
  isLocked: boolean;
  lockedBy: User | null;
  acquireLock: (projectId: number) => Promise<void>;
  releaseLock: (projectId: number) => Promise<void>;
  loadProject: (projectId: number) => Promise<void>;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockedBy, setLockedBy] = useState<User | null>(null);

  const acquireLock = async (projectId: number): Promise<void> => {
    try {
      await apiClient.post('/projects/' + projectId + '/lock');
      setIsLocked(true);
    } catch (error) {
      throw error;
    }
  };

  const releaseLock = async (projectId: number): Promise<void> => {
    try {
      await apiClient.delete('/projects/' + projectId + '/lock');
      setIsLocked(false);
      setLockedBy(null);
    } catch (error) {
      throw error;
    }
  };

  const loadProject = async (projectId: number): Promise<void> => {
    try {
      const response = await apiClient.get('/projects/' + projectId);
      setActiveProject(response.data);
      if (response.data.locked_by) {
        setIsLocked(true);
        setLockedBy(response.data.locked_by);
      }
    } catch (error) {
      throw error;
    }
  };

  const clearProject = (): void => {
    setActiveProject(null);
    setIsLocked(false);
    setLockedBy(null);
  };

  const value = {
    activeProject,
    isLocked,
    lockedBy,
    acquireLock,
    releaseLock,
    loadProject,
    clearProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}