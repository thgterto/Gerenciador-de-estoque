
import React from 'react';
import { Modal as PolarisModal } from '@shopify/polaris';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
  noPadding?: boolean; 
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    className = '',
    hideHeader = false,
    noPadding = false 
}) => {

  // Map className to Polaris Modal size
  let size: 'small' | 'large' | 'fullScreen' | undefined;
  if (className.includes('max-w-4xl') || className.includes('max-w-5xl') || className.includes('max-w-6xl') || className.includes('max-w-7xl')) {
      size = 'large';
  } else if (className.includes('max-w-sm') || className.includes('max-w-xs') || className.includes('max-w-md')) {
      size = 'small';
  }

  return (
      <PolarisModal
          open={isOpen}
          onClose={onClose || (() => {})}
          title={hideHeader ? undefined : title}
          size={size}
      >
          {noPadding ? (
              children
          ) : (
              <PolarisModal.Section>
                    {children}
              </PolarisModal.Section>
          )}
      </PolarisModal>
  );
};
