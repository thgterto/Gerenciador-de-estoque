import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Button } from './Button';
import { Icon } from './Icon';

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
    <Box
        className={className}
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 2,
            textAlign: 'center',
            height: '100%',
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
            }
        }}
    >
      <Paper
        elevation={0}
        sx={{
            p: 3,
            mb: 2,
            borderRadius: 4,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
        <Icon name={icon} size={48} className="text-gray-400" />
      </Paper>
      
      <Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 4, mx: 'auto' }}>
        {description}
      </Typography>
      
      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          onClick={onAction} 
          icon="add"
          sx={{ px: 3, boxShadow: 2 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
