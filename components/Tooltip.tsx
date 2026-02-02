
import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number>(undefined);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Position Classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow Classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-flex items-center justify-center" 
      onMouseEnter={showTooltip} 
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-md shadow-xl whitespace-nowrap animate-fade-in ${positionClasses[position]}`}>
          {content}
          {/* Seta do Tooltip */}
          <div className={`absolute border-4 ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
};
