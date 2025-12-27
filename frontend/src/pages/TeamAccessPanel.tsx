import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import { RoleBadge } from '../components/RoleBadge'
import { PermissionMatrixCell } from '../components/PermissionMatrixCell'
import { EmptyStatePlaceholder } from '../components/EmptyStatePlaceholder'

export function TeamAccessPanel(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { project, loading, error, getProject } = useProject()
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    if (projectId) {
      getProject(projectId)
    }
  }, [projectId, getProject])

  useEffect(() => {
    if (project?.assigned_team_members) {
      setTeamMembers(project.assigned_team_members)
    }
  }, [project])

  const getPermissionForSection = (role: string, section: string): 'edit' | 'view' | 'none' => {
    if (role === 'admin') {
      return 'edit'
    }
    
    if (role === 'sales') {
      if (section === 'Customer Info' || section === 'Location' || section === 'Payment') {
        return 'edit'
      }
      return 'view'
    }
    
    if (role === 'scheduler') {
      if (section === 'Install Schedule') {
        return 'edit'
      }
      return 'view'
    }
    
    if (role === 'production') {
      if (section === 'Project Details' || section === 'Electrical') {
        return 'edit'
      }
      return 'view'
    }
    
    if (role === 'installer') {
      return 'view'
    }
    
    return 'none'
  }

  if (loading) {
    return (
      <div className="loading-spinner">Loading...</div>
    )
  }

  if (error) {
    return (
      <div className="error-banner">
        {error.message}
      </div>
    )
  }

  return (
    <div className="team-access-panel">
      <h1>Team Access</h1>
      
      {teamMembers.length === 0 ? (
        <EmptyStatePlaceholder
          type="noAccess"
          actionLabel="Assign Team"
          onAction={() => navigate('/assign-team')}
        />
      ) : (
        <table className="team-access-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Customer Info</th>
              <th>Location</th>
              <th>Project Details</th>
              <th>Electrical</th>
              <th>Install Schedule</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member, index) => (
              <tr key={index}>
                <td>{member.name}</td>
                <td>
                  <RoleBadge role={member.role} size="small" />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Customer Info')} 
                  />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Location')} 
                  />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Project Details')} 
                  />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Electrical')} 
                  />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Install Schedule')} 
                  />
                </td>
                <td>
                  <PermissionMatrixCell 
                    permission={getPermissionForSection(member.role, 'Payment')} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}