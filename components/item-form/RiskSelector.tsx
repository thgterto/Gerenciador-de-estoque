
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
            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Riscos Associados</label>
            <div className="flex flex-wrap gap-2">
                {GHS_OPTIONS.map((ghs) => {
                    const isChecked = risks?.[ghs.key] || false;
                    return (
                        <Tooltip key={ghs.key} content={ghs.label} position="top">
                            <div
                                onClick={() => toggleRisk(ghs.key)}
                                className={`cursor-pointer border rounded-lg size-8 flex items-center justify-center transition-all ${
                                    isChecked
                                    ? 'bg-white border-red-500 shadow ring-1 ring-red-500'
                                    : 'bg-white/50 border-transparent hover:bg-white'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isChecked ? ghs.textColor : 'text-slate-300'}`}>{ghs.icon}</span>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};
