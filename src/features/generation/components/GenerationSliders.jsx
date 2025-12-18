import React from 'react';

/**
 * GenerationSliders component for controlling generation parameters.
 * 
 * @param {object} props - Component props
 * @param {number} props.steps - Number of generation steps
 * @param {function} props.onStepsChange - Callback when steps change
 * @param {number} props.variants - Number of image variants
 * @param {function} props.onVariantsChange - Callback when variants change
 * @returns {JSX.Element}
 */
const GenerationSliders = ({
    steps,
    onStepsChange,
    variants,
    onVariantsChange
}) => {
    return (
        <div className="space-y-4 pt-4 border-t border-outline-variant">
            <div>
                <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                    <span>Steps</span>
                    <span className="text-primary font-medium">{steps}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="30"
                    value={steps}
                    onChange={(e) => onStepsChange(Number(e.target.value))}
                    className="m3-slider w-full"
                    id="steps-slider"
                    aria-label="Number of generation steps"
                    aria-valuemin="10"
                    aria-valuemax="30"
                    aria-valuenow={steps}
                    aria-valuetext={`${steps} steps`}
                />
            </div>
            <div>
                <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                    <span>Variants</span>
                    <span className="text-primary font-medium">{variants}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="4"
                    value={variants}
                    onChange={(e) => onVariantsChange(Number(e.target.value))}
                    className="m3-slider w-full"
                    id="variants-slider"
                    aria-label="Number of image variants to generate"
                    aria-valuemin="1"
                    aria-valuemax="4"
                    aria-valuenow={variants}
                    aria-valuetext={`${variants} ${variants === 1 ? 'variant' : 'variants'}`}
                />
            </div>
        </div>
    );
};

export default GenerationSliders;
