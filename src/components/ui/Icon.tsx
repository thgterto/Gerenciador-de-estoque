
import React from 'react';

export type IconName = string;

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name: IconName;
    size?: number; // Tamanho em pixels (font-size)
    filled?: boolean; // Controla font-variation-settings
    className?: string;
}

export const Icon: React.FC<IconProps> = ({ 
    name, 
    size = 20, 
    filled = false, 
    className = '',
    ...props 
}) => {
    // Estilo inline para garantir overrides específicos sem !important no CSS
    const style = {
        fontSize: `${size}px`,
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    };

    return (
        <span 
            className={`material-symbols-outlined select-none align-middle ${className}`} 
            style={style}
            aria-hidden="true"
            {...props}
        >
            {name}
        </span>
    );
};
