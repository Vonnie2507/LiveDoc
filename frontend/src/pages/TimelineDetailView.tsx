import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChangeHistory } from '../hooks/useChangeHistory'
import { TimelineEntryCard } from '../components/TimelineEntryCard'
import { ChangeHistoryItem } from '../components/ChangeHistoryItem'
import { DiffTextDisplay } from '../components/DiffTextDisplay'
import { EmptyStatePlaceholder } from '../components/EmptyStatePlaceholder'

export function TimelineDetailView(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const { changeHistory, loading, error, getChangeHistory } = useChangeHistory()
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (projectId) {
      getChangeHistory(projectId)
    }
  }, [projectId, getChangeHistory])

  const handleToggleExpand = (entryId: string) => {
    const newExpandedIds = new Set(expandedEntryIds)
    if (newExpandedIds.has(entryId)) {
      newExpandedIds.delete(entryId)
    } else {
      newExpandedIds.add(entryId)
    }
    setExpandedEntryIds(newExpandedIds)
  }

  if (loading) {
    return (
      <div className="timeline-detail-view">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="timeline-detail-view">
        <div className="error-banner">{error.message}</div>
      </div>
    )
  }

  const filteredHistory = filterType === 'all' 
    ? changeHistory 
    : changeHistory.filter(entry => entry.change_type === filterType)

  const sortedHistory = [...filteredHistory].sort((a, b) => 
    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  )

  return (
    <div className="timeline-detail-view">
      <h1>Change History</h1>
      
      <div className="filter-buttons">
        <button 
          onClick={() => setFilterType('all')} 
          className={filterType === 'all' ? 'active' : ''}
        >
          All
        </button>
        <button 
          onClick={() => setFilterType('standard')} 
          className={filterType === 'standard' ? 'active' : ''}
        >
          Standard
        </button>
        <button 
          onClick={() => setFilterType('statusChange')} 
          className={filterType === 'statusChange' ? 'active' : ''}
        >
          Status Change
        </button>
        <button 
          onClick={() => setFilterType('aiExtraction')} 
          className={filterType === 'aiExtraction' ? 'active' : ''}
        >
          AI Extraction
        </button>
        <button 
          onClick={() => setFilterType('note')} 
          className={filterType === 'note' ? 'active' : ''}
        >
          Note
        </button>
      </div>

      {sortedHistory.length === 0 ? (
        <EmptyStatePlaceholder type="noHistory" />
      ) : (
        <div className="timeline-entries">
          {sortedHistory.map(entry => (
            <TimelineEntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedEntryIds.has(entry.id)}
              onToggle={() => handleToggleExpand(entry.id)}
            >
              {expandedEntryIds.has(entry.id) && (
                <ChangeHistoryItem
                  changeType={entry.change_type}
                  fieldName={entry.field_name}
                  oldValue={entry.old_value}
                  newValue={entry.new_value}
                  changedBy={entry.user}
                  changedAt={entry.changed_at}
                  isExpanded={true}
                  onToggle={() => {}}
                >
                  {entry.change_type === 'standard' && (
                    <DiffTextDisplay
                      oldValue={entry.old_value}
                      newValue={entry.new_value}
                      sourceRole={entry.user.role}
                    />
                  )}
                </ChangeHistoryItem>
              )}
            </TimelineEntryCard>
          ))}
        </div>
      )}
    </div>
  )
}