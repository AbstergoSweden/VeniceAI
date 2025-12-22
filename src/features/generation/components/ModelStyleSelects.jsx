import React from 'react';

/**
 * ModelStyleSelects component for choosing image generation model and style preset.
 */
const ModelStyleSelects = ({
    selectedModel,
    onModelChange,
    modelsList = [],
    selectedStyle,
    onStyleChange,
    stylesList = []
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="model-select" className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                    Model
                </label>
                <div className="relative">
                    <select
                        id="model-select"
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer hover:bg-black/30"
                        aria-label="Select Model"
                    >
                        {modelsList.map(m => (
                            <option key={m.id} value={m.id} className="bg-surface-container-high text-on-surface">
                                {m.name || m.id}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="style-select" className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                    Style
                </label>
                <div className="relative">
                    <select
                        id="style-select"
                        value={selectedStyle}
                        onChange={(e) => onStyleChange(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer hover:bg-black/30"
                        aria-label="Select Style"
                    >
                        <option value="none" className="bg-surface-container-high text-on-surface">None</option>
                        {stylesList.map(s => (
                            <option key={s.id || s} value={s.id || s} className="bg-surface-container-high text-on-surface">
                                {s.name || s}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelStyleSelects;
