import React from 'react';
import { RefreshCw, Sparkles, Loader2, Trash2, ImageIcon, Settings2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import PromptInput from './PromptInput';
import ModelStyleSelects from './ModelStyleSelects';
import GenerationSliders from './GenerationSliders';
import AspectRatioSelector from './AspectRatioSelector';

/**
 * ControlPanel component - Complete sidebar for image generation controls.
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
        <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/3 space-y-6"
        >
            <div className="bg-surface/30 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-on-surface">
                    <Settings2 className="w-5 h-5 text-secondary" /> Controls
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                            Negative Prompt
                        </label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => onNegativePromptChange(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none h-20 placeholder-white/20"
                            placeholder="Elements to avoid..."
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
                    <div className="grid grid-cols-2 gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group select-none">
                            <input
                                type="checkbox"
                                checked={hideWatermark}
                                onChange={(e) => onWatermarkChange(e.target.checked)}
                                className="mr-2 accent-primary w-4 h-4 rounded-sm"
                            />
                            <span className="group-hover:text-on-surface transition-colors">
                                Hide Watermark
                            </span>
                        </label>
                        <label className="flex items-center text-xs text-on-surface-variant cursor-pointer group select-none">
                            <input
                                type="checkbox"
                                checked={safeMode}
                                onChange={(e) => onSafeModeChange(e.target.checked)}
                                className="mr-2 accent-primary w-4 h-4 rounded-sm"
                            />
                            <span className="group-hover:text-on-surface transition-colors">
                                Blur NSFW
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col gap-3">
                        <Motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={generating}
                            className={`w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex justify-center items-center gap-2 ${generating
                                    ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary via-purple-500 to-tertiary shadow-primary/25'
                                }`}
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" /> Generate Image
                                </>
                            )}
                        </Motion.button>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={onClearHistory}
                                className="py-2 px-2 text-[10px] sm:text-xs rounded-lg border border-error/30 text-error hover:bg-error/10 flex items-center justify-center gap-1 transition-colors"
                                aria-label="Clear all generated image history"
                            >
                                <Trash2 className="w-3 h-3" /> History
                            </button>
                            <button
                                type="button"
                                onClick={onClearCache}
                                className="py-2 px-2 text-[10px] sm:text-xs rounded-lg border border-white/10 text-on-surface-variant hover:bg-white/5 flex items-center justify-center gap-1 transition-colors"
                                aria-label="Clear image cache to free up memory"
                            >
                                <Trash2 className="w-3 h-3" /> Cache
                            </button>
                            <button
                                type="button"
                                onClick={onShowCacheStats}
                                className="py-2 px-2 text-[10px] sm:text-xs rounded-lg border border-white/10 text-on-surface-variant hover:bg-white/5 flex items-center justify-center gap-1 transition-colors"
                                aria-label="View image cache statistics"
                            >
                                <ImageIcon className="w-3 h-3" /> Stats
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Motion.div>
    );
};

export default ControlPanel;
