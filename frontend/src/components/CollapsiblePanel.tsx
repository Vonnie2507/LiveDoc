import React from 'react'
import { CollapsiblePanelProps } from '../types/props'

export function CollapsiblePanel(props: CollapsiblePanelProps): JSX.Element {
  const { title, isExpanded, onToggle, children } = props

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div 
        className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={onToggle}
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : 'transform rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div
        className={`transition-all duration-200 ${
          isExpanded 
            ? 'block opacity-100 max-h-screen' 
            : 'hidden opacity-0 max-h-0'
        }`}
        style={{
          display: isExpanded ? 'block' : 'none'
        }}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}