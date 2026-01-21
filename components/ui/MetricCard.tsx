
import React from 'react';
import { Icon } from './Icon';

interface MetricCardProps {
    title: string;
    icon: string;
    value: string | number;
    subValue?: string | React.ReactNode;
    variant?: 'primary' | 'warning' | 'danger' | 'success' | 'info' | 'default';
    className?: string;
    delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    icon, 
    value, 
    subValue, 
    variant = 'default',
    className = '',
    delay
}) => {
    
    // Configuração de cores baseada no design system
    const colorConfig = {
        primary: {
            box: 'bg-primary/10 text-primary',
            text: 'text-text-main dark:text-white',
            border: ''
        },
        success: {
            box: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
            text: 'text-slate-900 dark:text-white',
            border: ''
        },
        warning: {
            box: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
            text: 'text-slate-900 dark:text-white',
            border: ''
        },
        danger: {
            box: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
            text: 'text-slate-900 dark:text-white',
            border: ''
        },
        info: {
            box: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            text: 'text-slate-900 dark:text-white',
            border: ''
        },
        default: {
            box: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
            text: 'text-slate-900 dark:text-white',
            border: ''
        }
    };

    const colors = colorConfig[variant] || colorConfig.default;

    return (
        <div 
            className={`
                bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm 
                flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md transition-all duration-300
                ${className} ${delay ? 'animate-slide-up' : ''}
            `}
            style={delay ? { animationDelay: `${delay}ms` } : {}}
        >
            {/* Efeito de Ícone Gigante no Fundo (Watermark) */}
            <div className={`absolute right-0 top-0 p-4 opacity-5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500 pointer-events-none`}>
                <Icon name={icon} className="text-8xl" />
            </div>

            <div className="flex items-center justify-between z-10 relative mb-4">
                <p className="text-text-secondary dark:text-gray-400 font-medium text-sm">{title}</p>
                <div className={`rounded-md p-1.5 flex items-center justify-center ${colors.box}`}>
                    <Icon name={icon} size={20} />
                </div>
            </div>

            <div className="z-10 relative">
                <h3 className={`text-2xl font-bold tracking-tight ${colors.text}`}>{value}</h3>
                {subValue && (
                    <div className="mt-1 text-xs font-medium">
                        {subValue}
                    </div>
                )}
            </div>
        </div>
    );
};
