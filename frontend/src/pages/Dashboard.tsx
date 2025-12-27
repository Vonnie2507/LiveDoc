import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import { StatusBadge } from '../components/StatusBadge'
import { RoleBadge } from '../components/RoleBadge'
import { EmptyStatePlaceholder } from '../components/EmptyStatePlaceholder'
import { formatDate } from '../utils/formatters'

export function Dashboard(): JSX.Element {
  const { currentUser } = useAuth()
  const { projects, loading, error, listProjects } = useProject()

  useEffect(() => {
    listProjects()
  }, [])

  const handleEmptyStateAction = () => {
    window.location.href = '/projects/new'
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          {currentUser && (
            <div className="role-badge-container">
              <RoleBadge role={currentUser.role} size="small" />
            </div>
          )}
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading projects...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        {currentUser && (
          <div className="role-badge-container">
            <RoleBadge role={currentUser.role} size="small" />
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}

      {projects.length === 0 && !loading ? (
        <EmptyStatePlaceholder 
          type="noProjects"
          actionLabel="Create Project"
          onAction={handleEmptyStateAction}
        />
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="project-card-link"
            >
              <div className="project-card">
                <div className="project-card-header">
                  <h3 className="project-name">{project.name}</h3>
                  <StatusBadge status={project.status} size="medium" />
                </div>
                <div className="project-card-footer">
                  <span className="last-updated">
                    Last updated: {formatDate(project.updated_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}