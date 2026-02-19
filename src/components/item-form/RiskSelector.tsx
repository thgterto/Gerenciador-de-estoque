
import React from 'react';
import { RiskFlags } from '../../types';
import { GHS_OPTIONS } from '../../utils/businessRules';
import { Tooltip } from '../Tooltip';

interface RiskSelectorProps {
    risks: RiskFlags;
    onChange: (risks: RiskFlags) => void;
}

export const RiskSelector: React.FC<RiskSelectorProps> = ({ risks, onChange }) => {

    const toggleRisk = (key: keyof RiskFlags) => {
        onChange({ ...risks, [key]: !risks[key] });
    };

    return (
        <div>
            <span className="block text-xs font-bold text-orbital-subtext uppercase tracking-wider mb-2">
                Associated Risks (GHS)
            </span>
            <div className="flex flex-wrap gap-2">
                {GHS_OPTIONS.map((ghs) => {
                    const isChecked = risks?.[ghs.key] || false;
                    return (
                        <Tooltip key={ghs.key} content={ghs.label}>
                            <div
                                onClick={() => toggleRisk(ghs.key)}
                                className={`
                                    w-9 h-9 flex items-center justify-center rounded border transition-all cursor-pointer
                                    ${isChecked
                                        ? 'bg-orbital-danger/20 border-orbital-danger text-orbital-danger shadow-[0_0_10px_rgba(255,50,50,0.3)]'
                                        : 'bg-orbital-surface border-orbital-border text-orbital-subtext hover:border-orbital-danger hover:text-orbital-danger'
                                    }
                                `}
                            >
                                <span className="material-symbols-outlined text-[20px]">{ghs.icon}</span>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};
