import React from 'react'
import { RoleBadgeProps } from '../types/props'

export function RoleBadge(props: RoleBadgeProps): JSX.Element {
  const { role, size } = props;

  const roleConfig = {
    'sales': { label: 'Sales', color: 'blue' },
    'scheduler': { label: 'Scheduler', color: 'purple' },
    'production': { label: 'Production', color: 'orange' },
    'installer': { label: 'Installer', color: 'green' },
    'admin': { label: 'Admin', color: 'red' }
  };

  const config = roleConfig[role];
  
  if (!config) {
    return (
      <span className={`role-badge--gray role-badge--${size}`}>
        Unknown
      </span>
    );
  }

  return (
    <span className={`role-badge--${config.color} role-badge--${size}`}>
      {config.label}
    </span>
  );
}