import React from 'react';

interface OrbitalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'default';
    size?: 'sm' | 'md' | 'lg';
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}

export const OrbitalButton: React.FC<OrbitalButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    startIcon,
    endIcon,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'bg-orbital-primary text-black border border-orbital-primary hover:bg-orbital-primary/90 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        secondary: 'bg-transparent text-orbital-primary border border-orbital-primary/50 hover:bg-orbital-primary/10 hover:border-orbital-primary',
        danger: 'bg-orbital-danger/10 text-orbital-danger border border-orbital-danger hover:bg-orbital-danger/20',
        ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
        default: 'bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700 hover:border-gray-500',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
    };

    return (
        <button
            className={`
                relative
                font-mono font-bold uppercase tracking-wider
                transition-all duration-200 ease-out
                flex items-center justify-center gap-2
                rounded-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                active:translate-y-[1px]
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {startIcon && <span className="w-4 h-4 flex items-center justify-center">{startIcon}</span>}
            {children}
            {endIcon && <span className="w-4 h-4 flex items-center justify-center">{endIcon}</span>}

            {/* Corner Accents for Primary */}
            {variant === 'primary' && (
                <>
                    <span className="absolute top-0 right-0 w-1 h-1 bg-white/50" />
                    <span className="absolute bottom-0 left-0 w-1 h-1 bg-white/50" />
                </>
            )}
        </button>
    );
};
