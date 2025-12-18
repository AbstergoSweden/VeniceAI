import React from 'react';
import { RefreshCw, Sparkles, Loader2, Trash2, ImageIcon } from 'lucide-react';
import PromptInput from './PromptInput';
import ModelStyleSelects from './ModelStyleSelects';
import GenerationSliders from './GenerationSliders';
import AspectRatioSelector from './AspectRatioSelector';

/**
 * ControlPanel component - Complete sidebar for image generation controls.
 * Combines prompt input, model selection, sliders, and generation actions.
 * 
 * @param {object} props - Component props
 * @param {string} props.prompt - Current prompt text
 * @param {function} props.onPromptChange - Callback when prompt changes
 * @param {string} props.negativePrompt - Negative prompt text
 * @param {function} props.onNegativePromptChange - Callback when negative prompt changes
 * @param {boolean} props.promptLoading - Loading state for prompt enhancement
 * @param {function} props.onSuggest - Generate prompt from idea
 * @param {function} props.onEnhance - Enhance current prompt
 * @param {function} props.onDescribe - Open image description modal
 * @param {string} props.selectedModel - Selected model ID
 * @param {function} props.onModelChange - Model change callback
 * @param {Array} props.modelsList - Available models
 * @param {string} props.selectedStyle - Selected style
 * @param {function} props.onStyleChange - Style change callback
 * @param {Array} props.stylesList - Available styles
 * @param {number} props.steps - Generation steps
 * @param {function} props.onStepsChange - Steps change callback
 * @param {number} props.variants - Number of variants
 * @param {function} props.onVariantsChange - Variants change callback
 * @param {string} props.aspectRatio - Aspect ratio selection
 * @param {function} props.onAspectRatioChange - Aspect ratio change callback
 * @param {boolean} props.hideWatermark - Watermark toggle state
 * @param {function} props.onWatermarkChange - Watermark toggle callback
 * @param {boolean} props.safeMode - NSFW blur toggle state
 * @param {function} props.onSafeModeChange - Safe mode toggle callback
 * @param {boolean} props.generating - Whether generation is in progress
 * @param {function} props.onGenerate - Generate button callback
 * @param {function} props.onClearHistory - Clear history callback
 * @param {function} props.onClearCache - Clear cache callback
 * @param {function} props.onShowCacheStats - Show cache stats callback
 * @returns {JSX.Element}
 */
const ControlPanel = ({
    prompt,
    onPromptChange,
    negativePrompt,
    onNegativePromptChange,
    promptLoading,
    onSuggest,
    onEnhance,
    onDescribe,
    selectedModel,
    onModelChange,
    modelsList,
    selectedStyle,
    onStyleChange,
    stylesList,
    steps,
    onStepsChange,
    variants,
    onVariantsChange,
    aspectRatio,
    onAspectRatioChange,
    hideWatermark,
    onWatermarkChange,
    safeMode,
    onSafeModeChange,
    generating,
    onGenerate,
    onClearHistory,
    onClearCache,
    onShowCacheStats
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate(e);
    };

    return (
        <div className="lg:w-1/3 space-y-6">
            <div className="m3-surface-elevated p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-on-surface">
                    <RefreshCw className="w-5 h-5 text-secondary" /> Controls
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Prompt Input */}
                    <PromptInput
                        value={prompt}
                        onChange={onPromptChange}
                        onSuggest={onSuggest}
                        onEnhance={onEnhance}
                        onDescribe={onDescribe}
                        loading={promptLoading}
                    />

                    {/* Negative Prompt */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-2">
                            Negative Prompt
                        </label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => onNegativePromptChange(e.target.value)}
                            className="m3-textfield w-full rounded-lg resize-none h-20 text-xs text-on-surface-variant"
                        />
                    </div>

                    {/* Model & Style */}
                    <ModelStyleSelects
                        selectedModel={selectedModel}
                        onModelChange={onModelChange}
                        modelsList={modelsList}
                        selectedStyle={selectedStyle}
                        onStyleChange={onStyleChange}
                        stylesList={stylesList}
                    />

                    {/* Sliders */}
                    <GenerationSliders
                        steps={steps}
                        onStepsChange={onStepsChange}
                        variants={variants}
                        onVariantsChange={onVariantsChange}
                    />

                    {/* Aspect Ratio */}
                    <AspectRatioSelector
                        value={aspectRatio}
                        onChange={onAspectRatioChange}
                    />

                    {/* Advanced Options */}
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={hideWatermark}
                                onChange={(e) => onWatermarkChange(e.target.checked)}
                                className="m3-checkbox mr-2"
                            />
                            <span className="group-hover:text-on-surface transition-colors">
                                Hide Watermark
                            </span>
                        </label>
                        <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={safeMode}
                                onChange={(e) => onSafeModeChange(e.target.checked)}
                                className="m3-checkbox mr-2"
                            />
                            <span className="group-hover:text-on-surface transition-colors">
                                Blur NSFW
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={generating}
                            className={`w-full py-3.5 px-4 rounded-full font-bold text-on-primary shadow-elevation-2 transition-all duration-300 flex justify-center items-center gap-2 ${generating
                                    ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary via-secondary to-tertiary hover:shadow-elevation-4 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles /> Generate
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClearHistory}
                            className="m3-button-outlined text-xs text-error border-error/50 hover:bg-error/10 flex items-center justify-center gap-1 py-2"
                            aria-label="Clear all generated image history"
                        >
                            <Trash2 className="w-3 h-3" /> Clear History
                        </button>
                        <button
                            type="button"
                            onClick={onClearCache}
                            className="m3-button-outlined text-xs text-on-surface-variant border-outline-variant/50 hover:bg-surface-container/50 flex items-center justify-center gap-1 py-2"
                            aria-label="Clear image cache to free up memory"
                        >
                            <Trash2 className="w-3 h-3" /> Clear Image Cache
                        </button>
                        <button
                            type="button"
                            onClick={onShowCacheStats}
                            className="m3-button-outlined text-xs text-on-surface-variant border-outline-variant/50 hover:bg-surface-container/50 flex items-center justify-center gap-1 py-2"
                            aria-label="View image cache statistics"
                        >
                            <ImageIcon className="w-3 h-3" /> Cache Stats
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ControlPanel;
