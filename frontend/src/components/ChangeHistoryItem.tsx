import React from 'react'
import { DiffTextDisplay } from './DiffTextDisplay'
import { ChangeHistoryItemProps, User } from '../types/props'
import { formatDate } from '../utils/formatters'

class DateFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DateFormatError'
  }
}

class UserDisplayError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserDisplayError'
  }
}

export function ChangeHistoryItem(props: ChangeHistoryItemProps): JSX.Element {
  const { changeType, fieldName, oldValue, newValue, changedBy, changedAt, isExpanded, onToggle } = props

  const changeTypeConfig = {
    'standard': { icon: 'pencil', color: 'blue', label: 'Edited' },
    'statusChange': { icon: 'flag', color: 'purple', label: 'Status Changed' },
    'aiExtraction': { icon: 'robot', color: 'orange', label: 'AI Extraction' },
    'note': { icon: 'comment', color: 'gray', label: 'Note Added' }
  }

  const config = changeTypeConfig[changeType]

  let formattedDate: string
  try {
    formattedDate = formatDate(changedAt, 'MMM DD, YYYY h:mm A')
  } catch (error) {
    if (error instanceof DateFormatError) {
      formattedDate = 'Unknown date'
    } else {
      throw error
    }
  }

  let userName: string
  try {
    if (!changedBy) {
      throw new UserDisplayError('User is null')
    }
    userName = changedBy.name
  } catch (error) {
    if (error instanceof UserDisplayError) {
      userName = 'System'
    } else {
      throw error
    }
  }

  return (
    <div 
      className={`change-history-item${isExpanded ? ' change-history-item--expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="change-history-item__header">
        <span className={`change-history-item__icon ${config.icon}`} style={{ backgroundColor: config.color }}></span>
        <span className="change-history-item__label">{config.label}</span>
        <span className="change-history-item__user">{userName}</span>
        <span className="change-history-item__date">{formattedDate}</span>
      </div>
      {isExpanded && (
        <>
          <DiffTextDisplay oldValue={oldValue} newValue={newValue} />
          <p>Field: {fieldName}</p>
        </>
      )}
    </div>
  )
}