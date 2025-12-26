import React from 'react'
import { QuestionInputFieldProps } from '../types/props'

export function QuestionInputField(props: QuestionInputFieldProps): JSX.Element {
  const { label, inputType, value, onChange, validationState, errorMessage } = props;

  const getCssClass = () => {
    switch (validationState) {
      case 'empty':
        return 'field--empty';
      case 'valid':
        return 'field--valid';
      case 'invalid':
        return 'field--invalid';
      default:
        return 'field--empty';
    }
  };

  const renderInput = () => {
    switch (inputType) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          />
        );
      case 'dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          >
            {props.options?.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className={getCssClass()}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={getCssClass()}
          />
        );
    }
  };

  return (
    <div>
      <label>{label}</label>
      {renderInput()}
      {validationState === 'invalid' && errorMessage && (
        <span style={{ color: 'red' }}>{errorMessage}</span>
      )}
    </div>
  );
}