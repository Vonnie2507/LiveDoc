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
      setLoading(true)
      apiClient.get(`/projects/${projectId}`)
        .then(response => {
          setProject(response.data)
          setLoading(false)
          setError(null)
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load project')
          setLoading(false)
        })
    }
  }, [projectId])

  const createProject = async (data: CreateProjectRequest): Promise<Project> => {
    try {
      setLoading(true)
      const response = await apiClient.post('/projects', data)
      setLoading(false)
      setError(null)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create project'
      setError(errorMessage)
      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const updateProject = async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const previousProject = project
    try {
      if (project && project.id === id) {
        setProject({ ...project, ...data })
      }
      setLoading(true)
      const response = await apiClient.put(`/projects/${id}`, data)
      setProject(response.data)
      setLoading(false)
      setError(null)
      return response.data
    } catch (err: any) {
      if (previousProject) {
        setProject(previousProject)
      }
      const errorMessage = err.response?.data?.message || 'Failed to update project'
      setError(errorMessage)
      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const deleteProject = async (id: string): Promise<void> => {
    const previousProjects = projects
    const previousProject = project
    try {
      setProjects(projects.filter(p => p.id !== id))
      if (project && project.id === id) {
        setProject(null)
      }
      setLoading(true)
      await apiClient.delete(`/projects/${id}`)
      setLoading(false)
      setError(null)
    } catch (err: any) {
      setProjects(previousProjects)
      if (previousProject) {
        setProject(previousProject)
      }
      const errorMessage = err.response?.data?.message || 'Failed to delete project'
      setError(errorMessage)
      setLoading(false)
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
      throw new Error('Failed to acquire lock')
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
      // Log warning but do not throw
    }
  }

  const refreshProject = async (id: string): Promise<void> => {
    try {
      const response = await apiClient.get(`/projects/${id}`)
      setProject(response.data)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load project'
      setError(errorMessage)
    }
  }

  const refreshProjects = async (): Promise<void> => {
    try {
      const response = await apiClient.get('/projects')
      setProjects(response.data)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load projects'
      setError(errorMessage)
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