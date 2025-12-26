import React from 'react'
import { PermissionMatrixCellProps } from '../types/props'

export function PermissionMatrixCell(props: PermissionMatrixCellProps): JSX.Element {
  const { permission } = props;
  
  const getIconAndStyle = () => {
    switch (permission) {
      case 'view':
        return {
          icon: '👁️',
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          tooltip: 'View Only'
        };
      case 'edit':
        return {
          icon: '✏️',
          backgroundColor: '#e8f5e8',
          color: '#388e3c',
          tooltip: 'Can Edit'
        };
      default:
        return {
          icon: '⊘',
          backgroundColor: '#f5f5f5',
          color: '#757575',
          tooltip: 'No Access'
        };
    }
  };

  const { icon, backgroundColor, color, tooltip } = getIconAndStyle();

  return (
    <div
      title={tooltip}
      style={{
        width: '40px',
        height: '40px',
        backgroundColor,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontSize: '20px',
        cursor: 'default'
      }}
    >
      {icon}
    </div>
  );
}