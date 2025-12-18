import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Wand2, X } from 'lucide-react';

/**
 * Modal for enhancing/upscaling images.
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {object} props.target - The image history item to enhance
 * @param {string} props.prompt - Enhancement prompt
 * @param {function} props.onPromptChange - Setter for prompt
 * @param {number} props.creativity - Creativity/Strength value (0-1)
 * @param {function} props.onCreativityChange - Setter for creativity
 * @param {function} props.onSubmit - Function to submit enhancement
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
                    className="m3-dialog-scrim fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
                >
                    <Motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="m3-dialog w-full max-w-md overflow-hidden bg-surface-container rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2"><Wand2 className="text-tertiary" /> Enhance Image</h3>
                            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition p-1 rounded-full hover:bg-surface-container-highest" aria-label="Close enhancement modal"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {target && (
                                <div className="flex gap-4 items-center bg-surface-container p-4 rounded-xl border border-outline-variant">
                                    <img src={`data:image/jpeg;base64,${target.base64}`} className="w-16 h-16 rounded-lg object-cover border border-outline-variant" alt="Target" />
                                    <div className="text-xs text-on-surface-variant">
                                        <p className="font-semibold text-on-surface">Selected Image</p>
                                        <p className="mt-1">Seed: <span className="text-primary">{target.params?.seed}</span></p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-2">Enhancement Prompt (Optional)</label>
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => onPromptChange(e.target.value)}
                                    className="m3-textfield w-full rounded-lg"
                                    placeholder="e.g., cinematic lighting, hyperrealistic, 8k"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm text-on-surface mb-2">
                                    <span>Creative Intensity</span> <span className="text-primary font-medium">{creativity}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.1"
                                    value={creativity}
                                    onChange={(e) => onCreativityChange(e.target.value)}
                                    className="m3-slider w-full"
                                />
                                <p className="text-[10px] text-on-surface-variant mt-1.5">Higher values allow the AI to deviate more from the original image.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
                            <button onClick={onClose} className="m3-button-outlined px-4 py-2 text-sm">Cancel</button>
                            <button onClick={onSubmit} className="m3-button-filled px-4 py-2 text-sm !bg-tertiary !text-on-tertiary">Apply Enhancement</button>
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default EnhanceModal;
