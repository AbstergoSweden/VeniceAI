import React from 'react';
import { ImageIcon, Download, Wand2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { VirtuosoGrid } from 'react-virtuoso';
import { GeneratingImageSkeleton } from '../../../components/ui/Skeleton';

/**
 * ImageGallery component for displaying generated images with actions.
 * Optimized with Virtual Scrolling and Skeleton loading states.
 */
const ImageGallery = ({
    images = [],
    isGenerating = false,
    generatingCount = 1,
    onDownload,
    onEnhance,
    onLoadMore,
    hasMore = false
}) => {
    // Show empty state if not generating and no images
    if (!isGenerating && images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-on-surface-variant/50">
                <Motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-full bg-white/5 mb-6"
                >
                    <ImageIcon className="w-16 h-16 opacity-50" />
                </Motion.div>
                <p className="text-xl font-medium text-on-surface/80">No masterpieces yet</p>
                <p className="text-sm mt-2 opacity-60 max-w-xs text-center">Ignite your creativity by entering a prompt and clicking Generate</p>
            </div>
        );
    }

    // Show skeleton placeholders when generating
    if (isGenerating && images.length === 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: generatingCount }).map((_, i) => (
                    <GeneratingImageSkeleton key={`skeleton-${i}`} />
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Show generating skeletons at top when adding to existing gallery */}
            {isGenerating && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {Array.from({ length: generatingCount }).map((_, i) => (
                        <GeneratingImageSkeleton key={`generating-${i}`} />
                    ))}
                </div>
            )}

            {/* Virtualized Grid */}
            <VirtuosoGrid
                useWindowScroll
                totalCount={images.length}
                overscan={400} // Render extra items for smooth scrolling
                components={{
                    List: React.forwardRef(({ style, children, ...props }, ref) => (
                        <div
                            ref={ref}
                            {...props}
                            style={{ ...style, width: '100%' }}
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-8"
                        >
                            {children}
                        </div>
                    )),
                    Item: React.forwardRef(({ children, ...props }, ref) => (
                        <div ref={ref} {...props} className="w-full">
                            {children}
                        </div>
                    )),
                    Footer: () => (
                        hasMore && onLoadMore && !isGenerating ? (
                            <div className="col-span-1 sm:col-span-2 xl:col-span-3 flex justify-center py-8">
                                <button
                                    onClick={onLoadMore}
                                    className="px-8 py-3 bg-surface/50 hover:bg-surface border border-white/10 hover:border-primary/30 rounded-xl text-sm font-semibold text-on-surface flex items-center gap-2 transition-colors"
                                >
                                    Load More
                                </button>
                            </div>
                        ) : <div className="py-4" />
                    )
                }}
                itemContent={(index) => {
                    const item = images[index];
                    return (
                        <Motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-surface-container shadow-lg border border-white/5 hover:border-primary/30 transition-colors"
                        >
                            <img
                                src={`data:image/jpeg;base64,${item.base64}`}
                                alt={item.params?.prompt || 'Generated Image'}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                loading="lazy"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 backdrop-blur-[2px]">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-sm text-white line-clamp-2 mb-3 font-medium text-shadow-sm">
                                        {item.params?.prompt}
                                    </p>

                                    <div className="flex items-center justify-between mb-4 text-[10px] text-white/70 uppercase tracking-wide">
                                        <span className="bg-white/10 px-2 py-0.5 rounded-full">{item.params?.model}</span>
                                        <span className="font-mono opacity-60">#{item.params?.seed?.toString().slice(0, 8)}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onDownload(item.base64, item.params?.seed)}
                                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors active:scale-95"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Save
                                        </button>
                                        <button
                                            onClick={() => onEnhance(item)}
                                            className="flex-1 py-2.5 bg-primary/20 hover:bg-primary/30 backdrop-blur-md border border-primary/30 rounded-xl text-xs font-semibold text-primary-light flex items-center justify-center gap-2 transition-colors active:scale-95"
                                        >
                                            <Wand2 className="w-3.5 h-3.5" /> Upscale
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Motion.div>
                    );
                }}
            />
        </>
    );
};

export default ImageGallery;
