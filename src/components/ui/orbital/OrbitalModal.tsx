import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface OrbitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const OrbitalModal: React.FC<OrbitalModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full m-4'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-orbital-bg/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-orbital-surface border border-orbital-border w-full ${sizes[size]} shadow-glow-lg animate-in fade-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-orbital-border bg-orbital-bg/50">
                    <h3 className="text-lg font-display font-bold uppercase tracking-widest text-orbital-text flex items-center gap-2">
                         <span className="w-2 h-2 bg-orbital-accent shadow-glow-sm" />
                         {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-orbital-subtext hover:text-orbital-danger transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-orbital-accent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-orbital-accent pointer-events-none" />
            </div>
        </div>
    );
};
