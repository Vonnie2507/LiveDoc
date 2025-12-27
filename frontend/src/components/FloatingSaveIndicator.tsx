import React from 'react';
import { FloatingSaveIndicatorProps } from '../types/props';

export function FloatingSaveIndicator(props: FloatingSaveIndicatorProps): JSX.Element {
  const { status, onRetry } = props;

  const getMessage = (): string => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'error':
        return 'Failed to save changes';
      default:
        return '';
    }
  };

  const getIcon = (): JSX.Element => {
    switch (status) {
      case 'saving':
        return (
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #ccc',
            borderTop: '2px solid #666',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        );
      case 'saved':
        return (
          <div style={{ color: '#10b981', fontSize: '16px' }}>✓</div>
        );
      case 'error':
        return (
          <div style={{ color: '#ef4444', fontSize: '16px' }}>✕</div>
        );
      default:
        return <div />;
    }
  };

  const getBackgroundColor = (): string => {
    switch (status) {
      case 'saving':
        return '#f3f4f6';
      case 'saved':
        return '#dcfce7';
      case 'error':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: getBackgroundColor(),
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: status === 'saved' ? 'fadeIn 0.3s ease-in, fadeOut 0.3s ease-out 2s' : 'fadeIn 0.3s ease-in'
        }}
      >
        {getIcon()}
        <span>{getMessage()}</span>
        {status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        )}
      </div>
    </>
  );
}