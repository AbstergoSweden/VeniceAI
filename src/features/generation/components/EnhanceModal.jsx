import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Sparkles } from 'lucide-react';

/**
 * Modal for enhancing/upscaling images.
 */
const EnhanceModal = ({
    isOpen,
    onClose,
    target,
    prompt,
    onPromptChange,
    creativity,
    onCreativityChange,
    onSubmit
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <Motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-md"
                >
                    <Motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-md overflow-hidden bg-surface-container rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-tertiary" /> Enhance Image
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-on-surface-variant/70 hover:text-on-surface transition p-1 rounded-full hover:bg-white/10"
                                aria-label="Close enhancement modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 bg-surface/80 backdrop-blur-xl">
                            {target && (
                                <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <img
                                        src={`data:image/jpeg;base64,${target.base64}`}
                                        className="w-16 h-16 rounded-lg object-cover border border-white/10"
                                        alt="Target"
                                    />
                                    <div className="text-xs text-on-surface-variant">
                                        <p className="font-semibold text-on-surface text-sm">Selected Image</p>
                                        <p className="mt-1 opacity-70">Seed: <span className="font-mono text-primary">{target.params?.seed}</span></p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                                    Enhancement Prompt (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => onPromptChange(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-tertiary/50 transition-all placeholder-white/20"
                                    placeholder="e.g., cinematic lighting, hyperrealistic, 8k"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-medium text-on-surface-variant mb-3">
                                    <span className="uppercase tracking-wider">Creative Intensity</span>
                                    <span className="text-tertiary bg-tertiary/10 px-2 py-0.5 rounded text-[10px] border border-tertiary/20">{creativity}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={creativity}
                                    onChange={(e) => onCreativityChange(e.target.value)}
                                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-tertiary hover:accent-tertiary/80 transition-all"
                                />
                                <p className="text-[10px] text-on-surface-variant/60 mt-2">
                                    Higher values allow the AI to deviate more from the original image structure.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <Motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onSubmit}
                                className="px-6 py-2.5 rounded-xl bg-tertiary hover:bg-tertiary/90 text-white text-sm font-bold shadow-lg shadow-tertiary/20 transition-colors flex items-center gap-2"
                            >
                                <Wand2 className="w-4 h-4" /> Apply Enhancement
                            </Motion.button>
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default EnhanceModal;
