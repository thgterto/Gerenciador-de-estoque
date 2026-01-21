
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
        window.addEventListener('keydown', handleEscape);
    }

    return () => {
        window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 isolate" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Container */}
      <div 
        className={`
            relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full flex flex-col 
            animate-scale-in transform transition-all border border-border-light dark:border-border-dark
            max-h-[90dvh] /* Limita altura para caber na tela com margem */
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
            FIX CRÍTICO DE SCROLL:
            Garante que o conteúdo interno role quando exceder o tamanho do modal.
            O container principal já tem max-h limitado pela viewport.
        */}
        <div className={`
            flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar
            ${noPadding ? 'p-0' : 'p-6'}
        `}>
            {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
