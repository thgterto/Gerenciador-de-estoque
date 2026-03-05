
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
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-500">
          {icon}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-text-secondary dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
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
