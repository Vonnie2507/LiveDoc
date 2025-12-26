import React from 'react';
import { ConfidenceScoreBadgeProps } from '../types/props';

export function ConfidenceScoreBadge(props: ConfidenceScoreBadgeProps): JSX.Element {
  const { confidenceScore, size } = props;
  
  const clampedScore = Math.max(0, Math.min(1, confidenceScore));
  const percentage = Math.round(clampedScore * 100);
  
  const validatedSize = size === 'small' || size === 'medium' ? size : 'medium';
  
  let backgroundColor: string;
  if (percentage < 50) {
    backgroundColor = '#dc3545';
  } else if (percentage < 80) {
    backgroundColor = '#ffc107';
  } else {
    backgroundColor = '#28a745';
  }
  
  const fontSize = validatedSize === 'small' ? '12px' : '16px';
  const padding = validatedSize === 'small' ? '4px' : '8px';
  
  return (
    <span
      style={{
        backgroundColor,
        color: 'white',
        fontSize,
        padding,
        borderRadius: '4px',
        display: 'inline-block'
      }}
    >
      {percentage}%
    </span>
  );
}