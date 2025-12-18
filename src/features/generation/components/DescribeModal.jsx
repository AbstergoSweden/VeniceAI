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
                    className="m3-dialog-scrim fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
                >
                    <Motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="m3-dialog w-full max-w-lg overflow-hidden bg-surface-container rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <ImageIcon className="text-tertiary" /> Describe Image
                            </h3>
                            <button onClick={onClose}
                                className="text-on-surface-variant hover:text-on-surface transition p-1 rounded-full hover:bg-surface-container-highest"
                                aria-label="Close image description modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Upload Area */}
                            {!uploadedImage ? (
                                <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 text-center hover:border-primary transition-colors cursor-pointer group">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={onImageUpload}
                                        className="hidden"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <ImageIcon className="w-14 h-14 mx-auto mb-3 text-on-surface-variant opacity-50 group-hover:text-primary group-hover:opacity-80 transition" />
                                        <p className="text-sm text-on-surface-variant mb-1">Click to upload an image</p>
                                        <p className="text-xs text-on-surface-variant opacity-60">PNG, JPG, WEBP up to 10MB</p>
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <img
                                            src={`data:image/jpeg;base64,${uploadedImage}`}
                                            alt="Uploaded"
                                            className="w-full h-48 object-contain rounded-xl bg-surface-container border border-outline-variant"
                                        />
                                        <button
                                            onClick={onRemoveImage}
                                            className="absolute top-2 right-2 p-1.5 bg-error hover:bg-error/80 text-on-error rounded-full transition shadow-elevation-2"
                                            aria-label="Remove uploaded image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {!imageDescription && (
                                        <button
                                            onClick={onDescribe}
                                            disabled={describingImage}
                                            className={`m3-button-filled w-full py-3 font-medium flex items-center justify-center gap-2 ${describingImage
                                                ? '!bg-surface-container-high !text-on-surface-variant cursor-not-allowed'
                                                : '!bg-tertiary !text-on-tertiary'
                                                }`}
                                        >
                                            {describingImage ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Image...</>
                                            ) : (
                                                <><Wand2 className="w-4 h-4" /> Describe Image</>
                                            )}
                                        </button>
                                    )}

                                    {imageDescription && (
                                        <div className="space-y-3">
                                            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant">
                                                <p className="text-sm text-on-surface leading-relaxed">{imageDescription}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={onDescribe}
                                                    disabled={describingImage}
                                                    className="m3-button-outlined flex-1 py-2.5 text-sm"
                                                >
                                                    Re-analyze
                                                </button>
                                                <button
                                                    onClick={onUseDescription}
                                                    className="m3-button-filled flex-1 py-2.5 text-sm !bg-primary !text-on-primary"
                                                >
                                                    Use as Prompt
                                                </button>
                                            </div>
                                        </div>
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
