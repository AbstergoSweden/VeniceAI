import React from 'react';

/**
 * ModelStyleSelects component for choosing image generation model and style preset.
 * 
 * @param {object} props - Component props
 * @param {string} props.selectedModel - Currently selected model ID
 * @param {function} props.onModelChange - Callback when model changes
 * @param {Array} props.modelsList - Available models
 * @param {string} props.selectedStyle - Currently selected style
 * @param {function} props.onStyleChange - Callback when style changes
 * @param {Array} props.stylesList - Available styles
 * @returns {JSX.Element}
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
                <label htmlFor="model-select" className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Model
                </label>
                <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="m3-select w-full"
                    aria-label="Image generation model selection"
                >
                    {modelsList.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.name || m.id}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="style-select" className="block text-xs font-medium text-on-surface-variant mb-1.5">
                    Style
                </label>
                <select
                    id="style-select"
                    value={selectedStyle}
                    onChange={(e) => onStyleChange(e.target.value)}
                    className="m3-select w-full"
                    aria-label="Image style preset selection"
                >
                    <option value="none">None</option>
                    {stylesList.map(s => (
                        <option key={s.id || s} value={s.id || s}>
                            {s.name || s}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ModelStyleSelects;
