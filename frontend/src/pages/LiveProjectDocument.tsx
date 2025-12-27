import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProject } from '../hooks/useProject'
import { useQuestions } from '../hooks/useQuestions'
import { useWebSocket } from '../hooks/useWebSocket'
import { useChangeHistory } from '../hooks/useChangeHistory'
import { SectionHeader } from '../components/SectionHeader'
import { QuestionInputField } from '../components/QuestionInputField'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { FloatingSaveIndicator } from '../components/FloatingSaveIndicator'
import { ChangeHistoryItem } from '../components/ChangeHistoryItem'
import { DiffTextDisplay } from '../components/DiffTextDisplay'

export function LiveProjectDocument(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const { user: currentUser } = useAuth()
  const { project, responses, getProject, updateProjectField, error } = useProject()
  const { questions, getQuestionsByStage } = useQuestions()
  const { joinProjectRoom, leaveProjectRoom, on } = useWebSocket()
  const { changeHistory, getChangeHistory } = useChangeHistory()
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Record<string, boolean>>({})
  const [lastFailedField, setLastFailedField] = useState<{ fieldCode: string; value: string } | null>(null)

  const sections = ['customer_info', 'location', 'project_details', 'electrical', 'install_schedule', 'payment']

  useEffect(() => {
    if (!projectId) return

    getProject(projectId)
    getQuestionsByStage('all')
    getChangeHistory(projectId)
    
    if (joinProjectRoom) {
      joinProjectRoom(projectId)
    }

    return () => {
      if (leaveProjectRoom) {
        leaveProjectRoom(projectId)
      }
    }
  }, [projectId])

  useEffect(() => {
    if (!on || !projectId) return

    const handleProjectUpdate = () => {
      getProject(projectId)
    }

    on('projectUpdate', handleProjectUpdate)
  }, [on, projectId])

  const handleFieldChange = async (fieldCode: string, value: string) => {
    if (!projectId) return

    setSaveStatus('saving')
    setLastFailedField({ fieldCode, value })

    try {
      await updateProjectField(projectId, fieldCode, value)
      setSaveStatus('saved')
      setLastFailedField(null)
    } catch {
      setSaveStatus('error')
    }
  }

  const handleRetry = async () => {
    if (!lastFailedField || !projectId) return

    setSaveStatus('saving')
    
    try {
      await updateProjectField(projectId, lastFailedField.fieldCode, lastFailedField.value)
      setSaveStatus('saved')
      setLastFailedField(null)
    } catch {
      setSaveStatus('error')
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleHistoryItem = (itemId: string, changedAt: string) => {
    const key = `${itemId}_${changedAt}`
    setExpandedHistoryItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getCompletionStatus = (section: string) => {
    const sectionQuestions = questions?.filter(q => q && q.field_code?.startsWith(section)) || []
    const answeredCount = sectionQuestions.filter(q => responses && responses[q.id] && responses[q.id].value).length
    
    if (answeredCount === 0) return 'incomplete'
    if (answeredCount === sectionQuestions.length) return 'complete'
    return 'inProgress'
  }

  const getAnswerCounts = (section: string) => {
    const sectionQuestions = questions?.filter(q => q && q.field_code?.startsWith(section)) || []
    const answeredCount = sectionQuestions.filter(q => responses && responses[q.id] && responses[q.id].value).length
    return { answerCount: answeredCount, totalQuestions: sectionQuestions.length }
  }

  if (error) {
    return (
      <div>
        <div style={{ backgroundColor: '#fee', color: '#c33', padding: '1rem', marginBottom: '1rem' }}>
          {error.message}
        </div>
      </div>
    )
  }

  const isLocked = project && project.locked_by && project.locked_by !== currentUser?.id

  return (
    <div>
      <h1>{project?.name || 'Loading...'}</h1>
      
      {isLocked && (
        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.75rem', marginBottom: '1rem' }}>
          Project locked by {project?.locked_by_name}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          {sections.map(section => {
            const sectionQuestions = questions?.filter(q => q && q.field_code?.startsWith(section)) || []
            const { answerCount, totalQuestions } = getAnswerCounts(section)
            
            return (
              <CollapsiblePanel
                key={section}
                title={
                  <SectionHeader
                    title={section}
                    completionStatus={getCompletionStatus(section)}
                    answerCount={answerCount}
                    totalQuestions={totalQuestions}
                  />
                }
                isExpanded={expandedSections[section] || false}
                onToggle={() => toggleSection(section)}
              >
                {sectionQuestions.map(question => (
                  <QuestionInputField
                    key={question.id}
                    label={question.label}
                    inputType={question.input_type}
                    value={responses && responses[question.id] ? responses[question.id].value : ''}
                    onChange={(value) => handleFieldChange(question.field_code, value)}
                    disabled={!!isLocked}
                  />
                ))}
              </CollapsiblePanel>
            )
          })}
        </div>

        <div style={{ width: '300px' }}>
          <CollapsiblePanel
            title="History"
            isExpanded={true}
            onToggle={() => {}}
          >
            {changeHistory?.map(entry => (
              <ChangeHistoryItem
                key={`${entry.id}_${entry.changed_at}`}
                changeType={entry.change_type}
                fieldName={entry.field_name}
                oldValue={entry.old_value}
                newValue={entry.new_value}
                changedBy={entry.user}
                changedAt={entry.changed_at}
                isExpanded={expandedHistoryItems[`${entry.id}_${entry.changed_at}`] || false}
                onToggle={() => toggleHistoryItem(entry.id, entry.changed_at)}
              />
            ))}
          </CollapsiblePanel>
        </div>
      </div>

      <FloatingSaveIndicator
        status={saveStatus}
        {...(saveStatus === 'error' && { onRetry: handleRetry })}
      />
    </div>
  )
}