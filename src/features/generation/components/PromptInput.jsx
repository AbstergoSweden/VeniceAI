import React from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

/**
 * PromptInput component for entering and enhancing image generation prompts.
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
                <label htmlFor="prompt-input" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Prompt
                </label>
                <div className="flex gap-2">
                    <Motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={onSuggest}
                        disabled={loading}
                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-1.5 px-2.5 flex items-center gap-1 transition-colors"
                        title="Generate prompt from idea"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-secondary" />} Idea
                    </Motion.button>
                    <Motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={onEnhance}
                        disabled={loading}
                        className="text-[10px] bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary-light rounded-md py-1.5 px-2.5 flex items-center gap-1 transition-colors"
                        title="Enhance current prompt with AI"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Enhance
                    </Motion.button>
                    <Motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={onDescribe}
                        className="text-[10px] bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/30 text-tertiary-light rounded-md py-1.5 px-2.5 flex items-center gap-1 transition-colors"
                        title="Describe an uploaded image"
                    >
                        <ImageIcon className="w-3 h-3" /> Describe
                    </Motion.button>
                </div>
            </div>
            <div className="relative group">
                <textarea
                    id="prompt-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none h-32 placeholder-white/20 scrollbar-hide"
                    placeholder="Describe your imagination... e.g., A futuristic cyberpunk city with neon lights reflecting on wet pavement, cinematic lighting, 8k resolution"
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-white/20 pointer-events-none">
                    {value.length} chars
                </div>
            </div>
        </div>
    );
};

export default PromptInput;
