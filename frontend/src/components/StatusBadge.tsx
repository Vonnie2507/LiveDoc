import React from 'react';
import { StatusBadgeProps } from '../types/props';

export function StatusBadge(props: StatusBadgeProps): JSX.Element {
  const { status, size } = props;

  const statusConfig = {
    'draft': { label: 'Draft', color: 'gray' },
    'quoted': { label: 'Quoted', color: 'blue' },
    'scheduled': { label: 'Scheduled', color: 'purple' },
    'in_progress': { label: 'In Progress', color: 'orange' },
    'completed': { label: 'Completed', color: 'green' },
    'cancelled': { label: 'Cancelled', color: 'red' }
  };

  const config = statusConfig[status] || { label: 'Unknown', color: 'gray' };

  const cssClasses = `status-badge status-badge--${config.color} status-badge--${size}`;

  return (
    <span className={cssClasses}>
      {config.label}
    </span>
  );
}