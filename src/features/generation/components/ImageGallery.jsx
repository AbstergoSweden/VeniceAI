import React from 'react';
import { ImageIcon, Download, Wand2, Loader2 } from 'lucide-react';

/**
 * ImageGallery component for displaying generated images with actions.
 * 
 * @param {object} props - Component props
 * @param {Array} props.images - Array of image objects with id, base64, params
 * @param {boolean} props.isGenerating - Whether images are currently being generated
 * @param {function} props.onDownload - Callback to download image (base64, seed)
 * @param {function} props.onEnhance - Callback to enhance image (item)
 * @returns {JSX.Element}
 */
const ImageGallery = ({
    images = [],
    isGenerating = false,
    onDownload,
    onEnhance
}) => {
    // Show empty state if not generating and no images
    if (!isGenerating && images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-on-surface-variant">
                <ImageIcon className="w-20 h-20 mb-4 opacity-40" />
                <p className="text-lg">No images generated yet.</p>
                <p className="text-sm mt-1 opacity-60">Enter a prompt and click Generate</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {images.map(item => (
                <div key={item.id} className="m3-media-card group relative aspect-square">
                    <img
                        src={`data:image/jpeg;base64,${item.base64}`}
                        alt={item.params?.prompt || 'Generated Image'}
                        className="w-full h-full object-cover transition-transform duration-500 ease-emphasized group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/95 via-surface-dim/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                        <p className="text-xs text-on-surface line-clamp-2 mb-2 font-medium">
                            {item.params?.prompt}
                        </p>
                        <div className="text-[10px] text-on-surface-variant flex justify-between mb-3">
                            <span>{item.params?.model}</span>
                            <span className="text-primary">S: {item.params?.seed}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onDownload(item.base64, item.params?.seed)}
                                className="m3-button-tonal flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1"
                                aria-label={`Download image with seed ${item.params?.seed}`}
                            >
                                <Download className="w-3 h-3" /> Save
                            </button>
                            <button
                                onClick={() => onEnhance(item)}
                                className="m3-button-tonal flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 !bg-tertiary-container !text-on-tertiary-container hover:!bg-tertiary"
                                aria-label={`Enhance image with seed ${item.params?.seed}`}
                            >
                                <Wand2 className="w-3 h-3" /> Enhance
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ImageGallery;
