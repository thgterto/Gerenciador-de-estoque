
import React from 'react';
import { OrbitalModal } from './orbital/OrbitalModal';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title?: string;
    children: React.ReactNode;
    hideHeader?: boolean;
    noPadding?: boolean;
    className?: string;
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, onClose, title, children, hideHeader, noPadding, footer, className
}) => {
    return (
        <OrbitalModal
            isOpen={isOpen}
            onClose={onClose || (() => {})}
            title={title || ''}
            hideHeader={hideHeader}
            noPadding={noPadding}
            className={className}
        >
            {children}
            {footer && (
                <div className="p-4 border-t border-orbital-border bg-orbital-bg/50 flex justify-end gap-2">
                    {footer}
                </div>
            )}
        </OrbitalModal>
    );
};
