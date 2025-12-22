import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

/**
 * AspectRatioSelector component for choosing image aspect ratio.
 */
const AspectRatioSelector = ({ value, onChange }) => {
    const ratios = [
        { id: 'square', label: 'Square', icon: Square, dim: '1:1' },
        { id: 'wide', label: 'Landscape', icon: RectangleHorizontal, dim: '16:9' },
        { id: 'tall', label: 'Portrait', icon: RectangleVertical, dim: '9:16' }
    ];

    return (
        <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
                Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
                {ratios.map((r) => {
                    const Icon = r.icon;
                    const isSelected = value === r.id;
                    return (
                        <Motion.button
                            key={r.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => onChange(r.id)}
                            className={`relative flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200 ${
                                isSelected
                                    ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]'
                                    : 'bg-black/20 border-white/10 text-on-surface-variant hover:bg-white/5 hover:border-white/20'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-on-surface-variant/70'}`} />
                            <div className="text-[10px] font-medium">{r.label}</div>
                            {isSelected && (
                                <Motion.div
                                    layoutId="ratio-indicator"
                                    className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </Motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default AspectRatioSelector;
