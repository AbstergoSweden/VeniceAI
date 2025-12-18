import React from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';

/**
 * PromptInput component for entering and enhancing image generation prompts.
 * 
 * @param {object} props - Component props
 * @param {string} props.value - Current prompt value
 * @param {function} props.onChange - Callback when prompt changes
 * @param {function} props.onSuggest - Callback to generate prompt from idea
 * @param {function} props.onEnhance - Callback to enhance current prompt
 * @param {function} props.onDescribe - Callback to open image description modal
 * @param {boolean} props.loading - Whether prompt generation is in progress
 * @returns {JSX.Element}
 */
const PromptInput = ({
    value,
    onChange,
    onSuggest,
    onEnhance,
    onDescribe,
    loading = false
}) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="prompt-input" className="text-sm font-medium text-on-surface">
                    Prompt
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSuggest}
                        disabled={loading}
                        className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1"
                        aria-label="Generate prompt from idea"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Idea
                    </button>
                    <button
                        type="button"
                        onClick={onEnhance}
                        disabled={loading}
                        className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1 !bg-primary-container !text-on-primary-container hover:!bg-primary hover:!text-on-primary"
                        aria-label="Enhance current prompt with AI"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Enhance
                    </button>
                    <button
                        type="button"
                        onClick={onDescribe}
                        className="m3-button-tonal text-xs py-1.5 px-3 flex items-center gap-1 !bg-tertiary-container !text-on-tertiary-container hover:!bg-tertiary hover:!text-on-tertiary"
                        aria-label="Describe an uploaded image to generate prompt"
                    >
                        <ImageIcon className="w-3 h-3" /> Describe
                    </button>
                </div>
            </div>
            <textarea
                id="prompt-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="m3-textfield w-full rounded-lg resize-none h-28"
                placeholder="A futuristic cityscape at dusk..."
            />
        </div>
    );
};

export default PromptInput;
