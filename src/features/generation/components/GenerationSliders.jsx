import React from 'react';

/**
 * GenerationSliders component for controlling generation parameters.
 */
const GenerationSliders = ({
    steps,
    onStepsChange,
    variants,
    onVariantsChange
}) => {
    return (
        <div className="space-y-6 pt-2">
            <div>
                <div className="flex justify-between text-xs font-medium text-on-surface-variant mb-3">
                    <span className="uppercase tracking-wider">Steps</span>
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] border border-primary/20">{steps}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="50"
                    value={steps}
                    onChange={(e) => onStepsChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                    id="steps-slider"
                    aria-label="Generation Steps"
                    aria-valuemin="10"
                    aria-valuemax="50"
                    aria-valuenow={steps}
                    aria-valuetext={`${steps} steps`}
                />
                <div className="flex justify-between text-[10px] text-white/20 mt-1">
                    <span>Fast</span>
                    <span>High Quality</span>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-xs font-medium text-on-surface-variant mb-3">
                    <span className="uppercase tracking-wider">Variants</span>
                    <span className="text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px] border border-primary/20">{variants}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="4"
                    value={variants}
                    onChange={(e) => onVariantsChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                    id="variants-slider"
                    aria-label="Generation Variants"
                    aria-valuemin="1"
                    aria-valuemax="4"
                    aria-valuenow={variants}
                    aria-valuetext={`${variants} variant${variants !== 1 ? 's' : ''}`}
                />
                 <div className="flex justify-between text-[10px] text-white/20 mt-1">
                    <span>1</span>
                    <span>4</span>
                </div>
            </div>
        </div>
    );
};

export default GenerationSliders;
