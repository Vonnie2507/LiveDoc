import React from 'react'
import { TimelineEntryCardProps } from '../types/props'
import { ChangeLog } from '../types/models'
import { DiffTextDisplay } from './DiffTextDisplay'

export function TimelineEntryCard(props: TimelineEntryCardProps): JSX.Element {
  const { entry, isExpanded, onToggle } = props

  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getBadgeColor = (changeType: string): string => {
    switch (changeType) {
      case 'standard':
        return '#3b82f6'
      case 'statusChange':
        return '#8b5cf6'
      case 'aiExtraction':
        return '#10b981'
      case 'note':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const changedBy = entry.changed_by || 'Unknown User'
  const fieldName = entry.field_name || 'Unknown Field'

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '12px',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f9fafb'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white'
    }}>
      <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {formatTimestamp(entry.changed_at)}
          </span>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            {changedBy}
          </span>
          <span style={{
            backgroundColor: getBadgeColor(entry.change_type),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {entry.change_type}
          </span>
        </div>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>
      
      {isExpanded ? (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
          <DiffTextDisplay 
            oldValue={entry.old_value || ''}
            newValue={entry.new_value || ''}
            sourceRole={entry.changed_by || 'Unknown User'}
          />
        </div>
      ) : (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
          Updated {fieldName}
        </div>
      )}
    </div>
  )
}