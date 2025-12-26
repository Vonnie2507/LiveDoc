import React from 'react'
import { DiffTextDisplayProps } from '../types/props'

export function DiffTextDisplay(props: DiffTextDisplayProps): JSX.Element {
  const { oldValue, newValue, sourceRole } = props;

  const safeOldValue = oldValue ?? '';
  const safeNewValue = newValue ?? '';

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'sales':
        return 'green';
      case 'scheduler':
        return 'blue';
      case 'production':
        return 'purple';
      case 'installer':
        return 'orange';
      default:
        return 'black';
    }
  };

  const formatValue = (value: string, isOld: boolean = false): JSX.Element => {
    if (value === '') {
      return (
        <span style={{ fontStyle: 'italic', color: 'gray' }}>
          (empty)
        </span>
      );
    }

    if (isOld) {
      return (
        <span style={{ textDecoration: 'line-through', color: 'gray' }}>
          {value}
        </span>
      );
    }

    return (
      <span style={{ color: getRoleColor(sourceRole) }}>
        {value}
      </span>
    );
  };

  if (safeOldValue === safeNewValue) {
    return (
      <div>
        {formatValue(safeNewValue)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {formatValue(safeOldValue, true)}
      {formatValue(safeNewValue)}
    </div>
  );
}