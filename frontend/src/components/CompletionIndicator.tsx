import React from 'react'
import { CompletionIndicatorProps } from '../types/props'

export function CompletionIndicator(props: CompletionIndicatorProps): JSX.Element {
  const { answeredCount, totalCount, showProgressBar } = props
  
  const safeAnsweredCount = Math.max(0, answeredCount)
  const safeTotalCount = Math.max(0, totalCount)
  
  let percentage: number
  if (safeTotalCount === 0) {
    percentage = 0
  } else {
    percentage = Math.round((safeAnsweredCount / safeTotalCount) * 100)
    percentage = Math.min(percentage, 100)
  }
  
  const renderIcon = () => {
    if (safeAnsweredCount === safeTotalCount && safeTotalCount > 0) {
      return (
        <span style={{ color: 'green', marginLeft: '8px' }}>
          ✓
        </span>
      )
    } else if (safeAnsweredCount === 0) {
      return (
        <span style={{ color: 'gray', marginLeft: '8px' }}>
          ○
        </span>
      )
    }
    return null
  }
  
  const renderProgressBar = () => {
    if (showProgressBar) {
      return (
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'gray',
          borderRadius: '4px',
          marginTop: '4px'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: 'green',
            borderRadius: '4px'
          }} />
        </div>
      )
    }
    return null
  }
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'gray', fontSize: 'medium' }}>
          {safeAnsweredCount} / {safeTotalCount}
        </span>
        {renderIcon()}
      </div>
      {renderProgressBar()}
    </div>
  )
}