
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

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
    className = 'max-w-lg', 
    hideHeader = false,
    noPadding = false 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEscape);
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div 
        className={`
            relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col 
            animate-scale-in transform transition-all border border-border-light dark:border-border-dark
            ${className}
        `}
      >
        {!hideHeader && (
             <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark shrink-0">
               <h3 className="font-bold text-lg text-text-main dark:text-white leading-6">{title}</h3>
               {onClose && (
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClose} 
                    className="w-8 h-8 p-0 justify-center text-text-secondary hover:text-text-main dark:hover:text-white"
                    aria-label="Fechar"
                    icon="close"
                   />
               )}
            </div>
        )}

        {/* 
            FIX CRÍTICO DE LAYOUT:
            Se noPadding=true, assumimos que o filho gerencia o layout (ex: Wizards, Dashboards).
            Removemos o overflow-y-auto daqui e aplicamos flex-col + overflow-hidden para travar o container
            e permitir que o filho use flex-1 overflow-auto em áreas específicas.
        */}
        <div className={`
            flex-1 min-h-0 w-full
            ${noPadding ? 'flex flex-col overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar p-6'}
        `}>
            {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
