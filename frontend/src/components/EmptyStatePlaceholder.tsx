import React from 'react'
import { EmptyStatePlaceholderProps } from '../types/props'
import { TouchTargetButton } from './TouchTargetButton'

export function EmptyStatePlaceholder(props: EmptyStatePlaceholderProps): JSX.Element {
  const { type, actionLabel, onAction } = props;

  let message: string;
  let iconElement: JSX.Element;

  switch (type) {
    case 'noProjects':
      message = 'No projects found. Create your first project to get started.';
      iconElement = (
        <svg width="64" height="64" fill="#6b7280" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
      );
      break;
    case 'noHistory':
      message = 'No change history available for this project.';
      iconElement = (
        <svg width="64" height="64" fill="#6b7280" viewBox="0 0 24 24">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
        </svg>
      );
      break;
    case 'noAccess':
      message = 'You do not have permission to view this content.';
      iconElement = (
        <svg width="64" height="64" fill="#6b7280" viewBox="0 0 24 24">
          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V17H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
        </svg>
      );
      break;
    default:
      message = 'No data available.';
      iconElement = (
        <svg width="64" height="64" fill="#6b7280" viewBox="0 0 24 24">
          <path d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10-4.48 10-10S17.52,2 12,2z"/>
        </svg>
      );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      backgroundColor: '#f9fafb'
    }}>
      {iconElement}
      <div style={{
        fontSize: '16px',
        color: '#6b7280',
        marginTop: '16px',
        textAlign: 'center'
      }}>
        {message}
      </div>
      {actionLabel && onAction && (
        <div style={{ marginTop: '24px' }}>
          <TouchTargetButton
            variant="primary"
            label={actionLabel}
            onClick={onAction}
          />
        </div>
      )}
    </div>
  );
}