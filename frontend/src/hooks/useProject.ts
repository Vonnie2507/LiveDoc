import { useState, useEffect } from 'react'
import { apiClient } from '../utils/apiClient'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/models'

export function useProject(projectId?: string): { 
  project: Project | null, 
  projects: Project[], 
  loading: boolean, 
  error: string | null, 
  createProject: (data: CreateProjectRequest) => Promise<Project>, 
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project>, 
  deleteProject: (id: string) => Promise<void>, 
  acquireLock: (id: string) => Promise<boolean>, 
  releaseLock: (id: string) => Promise<void>, 
  refreshProject: (id: string) => Promise<void>, 
  refreshProjects: () => Promise<void> 
} {
  const [project, setProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      const loadProject = async () => {
        setLoading(true)
        try {
          const response = await apiClient.get(`/projects/${projectId}`)
          setProject(response.data)
          setError(null)
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load project')
        } finally {
          setLoading(false)
        }
      }
      loadProject()
    }
  }, [projectId])

  const createProject = async (data: CreateProjectRequest): Promise<Project> => {
    try {
      const response = await apiClient.post('/projects', data)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create project'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateProject = async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const originalProject = project
    if (project && project.id === id) {
      setProject({ ...project, ...data })
    }
    
    try {
      const response = await apiClient.put(`/projects/${id}`, data)
      if (project && project.id === id) {
        setProject(response.data)
      }
      return response.data
    } catch (err: any) {
      if (originalProject && project && project.id === id) {
        setProject(originalProject)
      }
      const errorMessage = err.response?.data?.message || 'Failed to update project'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteProject = async (id: string): Promise<void> => {
    const originalProjects = [...projects]
    setProjects(projects.filter(p => p.id !== id))
    
    try {
      await apiClient.delete(`/projects/${id}`)
    } catch (err: any) {
      setProjects(originalProjects)
      const errorMessage = err.response?.data?.message || 'Failed to delete project'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const acquireLock = async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/projects/${id}/lock`)
      if (response.status === 200) {
        return true
      }
      if (response.status === 409) {
        return false
      }
      throw new Error('Unexpected response status')
    } catch (err: any) {
      if (err.response?.status === 409) {
        return false
      }
      const errorMessage = err.response?.data?.message || 'Failed to acquire lock'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const releaseLock = async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/projects/${id}/lock`)
    } catch (err: any) {
      // Handle success silently, log warning on failure but do not throw
    }
  }

  const refreshProject = async (id: string): Promise<void> => {
    try {
      const response = await apiClient.get(`/projects/${id}`)
      setProject(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project')
    }
  }

  const refreshProjects = async (): Promise<void> => {
    try {
      const response = await apiClient.get('/projects')
      setProjects(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects')
    }
  }

  return {
    project,
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    acquireLock,
    releaseLock,
    refreshProject,
    refreshProjects
  }
}