
import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon = 'search_off', 
  actionLabel, 
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center h-full animate-fade-in ${className}`}>
      <div className="p-4 mb-4">
        <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700">
          {icon}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          size="md" 
          onClick={onAction} 
          icon="add"
          className="px-6 shadow-md shadow-primary/20"
          data-testid="empty-state-action-button"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
