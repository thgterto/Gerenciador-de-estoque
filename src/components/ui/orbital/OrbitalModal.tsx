import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface OrbitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const OrbitalModal: React.FC<OrbitalModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    icon
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-full max-w-lg bg-orbital-bg border border-orbital-border
                rounded-sm shadow-orbital-hover
                flex flex-col overflow-hidden animate-scale-in
                ${className}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-orbital-border bg-orbital-card/50">
                    <div className="flex items-center gap-3">
                        {icon && <div className="text-orbital-primary">{icon}</div>}
                        <h2 className="text-lg font-display font-bold text-white tracking-wide uppercase">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[80vh]">
                    {children}
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-orbital-primary opacity-50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-orbital-primary opacity-50" />
            </div>
        </div>,
        document.body
    );
};
