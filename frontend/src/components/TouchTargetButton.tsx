import React from 'react'
import { TouchTargetButtonProps } from '../types/props'

export function TouchTargetButton(props: TouchTargetButtonProps): JSX.Element {
  const { variant, label, onClick, disabled } = props;

  let className = 'touch-target-button ';

  switch (variant) {
    case 'primary':
      className += 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ';
      break;
    case 'secondary':
      className += 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 ';
      break;
    case 'danger':
      className += 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ';
      break;
  }

  if (disabled) {
    className += 'opacity-50 cursor-not-allowed ';
  } else {
    className += 'cursor-pointer ';
  }

  className += 'min-h-11 px-4 py-2 rounded-md font-medium transition-colors duration-200 border-none outline-none focus:ring-2 focus:ring-offset-2';

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
      style={{ minHeight: '44px' }}
    >
      {label}
    </button>
  );
}