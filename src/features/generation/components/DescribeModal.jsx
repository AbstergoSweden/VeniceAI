import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';

/**
 * Modal for uploading an image and generating a prompt description from it.
 */
const DescribeModal = ({
    isOpen,
    onClose,
    uploadedImage,
    imageDescription,
    describingImage,
    onImageUpload,
    onDescribe,
    onUseDescription,
    onRemoveImage
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
                        className="w-full max-w-lg overflow-hidden bg-surface-container rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-tertiary" /> Describe Image
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-on-surface-variant/70 hover:text-on-surface transition p-1 rounded-full hover:bg-white/10"
                                aria-label="Close image description modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 bg-surface/80 backdrop-blur-xl">
                            {/* Upload Area */}
                            {!uploadedImage ? (
                                <Motion.div
                                    whileHover={{ scale: 1.01, borderColor: "rgba(var(--primary-rgb), 0.5)" }}
                                    className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center transition-colors cursor-pointer group bg-black/20"
                                >
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={onImageUpload}
                                        className="hidden"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer block w-full h-full">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container-high/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <ImageIcon className="w-8 h-8 text-on-surface-variant/50 group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface mb-1">Click to upload an image</p>
                                        <p className="text-xs text-on-surface-variant/60">PNG, JPG, WEBP up to 10MB</p>
                                    </label>
                                </Motion.div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <img
                                            src={`data:image/jpeg;base64,${uploadedImage}`}
                                            alt="Uploaded"
                                            className="w-full h-56 object-contain rounded-xl bg-black/40 border border-white/10"
                                        />
                                        <Motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={onRemoveImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-error/80 text-white rounded-full transition shadow-lg border border-white/10"
                                            aria-label="Remove uploaded image"
                                        >
                                            <X className="w-4 h-4" />
                                        </Motion.button>
                                    </div>

                                    {!imageDescription && (
                                        <Motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onDescribe}
                                            disabled={describingImage}
                                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex justify-center items-center gap-2 ${describingImage
                                                ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                                                : 'bg-gradient-to-r from-tertiary to-secondary shadow-tertiary/25'
                                            }`}
                                        >
                                            {describingImage ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image...</>
                                            ) : (
                                                <><Wand2 className="w-4 h-4" /> Describe Image</>
                                            )}
                                        </Motion.button>
                                    )}

                                    {imageDescription && (
                                        <Motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                <p className="text-sm text-on-surface leading-relaxed">{imageDescription}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={onDescribe}
                                                    disabled={describingImage}
                                                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-medium transition-colors"
                                                >
                                                    Re-analyze
                                                </button>
                                                <button
                                                    onClick={onUseDescription}
                                                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg transition-colors"
                                                >
                                                    Use as Prompt
                                                </button>
                                            </div>
                                        </Motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default DescribeModal;
