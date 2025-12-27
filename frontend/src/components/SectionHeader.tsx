import React from 'react'
import { CompletionIndicator } from './CompletionIndicator'
import { SectionHeaderProps } from '../types/props'

export function SectionHeader(props: SectionHeaderProps): JSX.Element {
  const { title, completionStatus, answerCount, totalQuestions } = props;
  
  const cssClass = `section-header--${completionStatus}`;

  return (
    <div className={cssClass} style={{ display: 'flex', justifyContent: 'space-between' }}>
      <h2>{title}</h2>
      <CompletionIndicator answerCount={answerCount} totalQuestions={totalQuestions} />
    </div>
  );
}