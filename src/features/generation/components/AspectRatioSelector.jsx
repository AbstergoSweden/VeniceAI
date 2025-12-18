import React from 'react';

/**
 * AspectRatioSelector component for choosing image aspect ratio.
 * 
 * @param {object} props - Component props
 * @param {string} props.value - Currently selected aspect ratio ('tall', 'wide', 'square')
 * @param {function} props.onChange - Callback when aspect ratio changes
 * @returns {JSX.Element}
 */
const AspectRatioSelector = ({ value, onChange }) => {
    const ratios = ['tall', 'wide', 'square'];

    return (
        <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-2">
                Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
                {ratios.map(r => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => onChange(r)}
                        className={`m3-chip py-2 text-center transition-all duration-200 ${value === r
                                ? 'm3-chip-selected !bg-primary !text-on-primary'
                                : 'hover:bg-surface-container-highest'
                            }`}
                    >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AspectRatioSelector;
