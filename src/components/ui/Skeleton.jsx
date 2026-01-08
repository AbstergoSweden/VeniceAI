import React from 'react';
import { motion as Motion } from 'framer-motion';

/**
 * Base skeleton component with shimmer animation.
 * Supports different variants and animation types.
 */
const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer'
}) => {
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded'
  };

  const baseClasses = `relative overflow-hidden bg-gray-200/20 ${variantClasses[variant]} ${className}`;
  const style = { width, height };

  if (animation === 'shimmer') {
    return (
      <div className={baseClasses} style={style}>
        <Motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
        />
      </div>
    );
  }

  // Pulse animation
  return (
    <Motion.div
      className={baseClasses}
      style={style}
      animate={{
        opacity: [0.6, 1, 0.6]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

/**
 * Skeleton for image card in gallery.
 */
export const ImageCardSkeleton = () => {
  return (
    <div className="bg-surface/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-3">
      {/* Image skeleton */}
      <Skeleton
        variant="rectangular"
        height="256px"
        className="w-full"
      />

      {/* Prompt skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" height="16px" className="w-3/4" />
        <Skeleton variant="text" height="16px" className="w-1/2" />
      </div>

      {/* Metadata skeleton */}
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height="24px" className="w-20" />
        <Skeleton variant="rectangular" height="24px" className="w-24" />
      </div>

      {/* Button skeletons */}
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" height="36px" className="flex-1" />
        <Skeleton variant="rectangular" height="36px" className="flex-1" />
      </div>
    </div>
  );
};

/**
 * Skeleton for gallery grid.
 */
export const GallerySkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ImageCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for chat messages.
 */
export const ChatMessageSkeleton = ({ isUser = false }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'bg-primary/20' : 'bg-surface/40'} rounded-2xl p-4`}>
        <div className="space-y-2">
          <Skeleton variant="text" height="14px" className="w-48" />
          <Skeleton variant="text" height="14px" className="w-36" />
          {!isUser && <Skeleton variant="text" height="14px" className="w-24" />}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for chat loading state.
 */
export const ChatSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      <ChatMessageSkeleton isUser={false} />
      <ChatMessageSkeleton isUser={true} />
      <ChatMessageSkeleton isUser={false} />
    </div>
  );
};

/**
 * Skeleton for model/style selectors.
 */
export const ModelSelectorSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton variant="text" height="12px" className="w-16" />
      <Skeleton variant="rectangular" height="40px" className="w-full rounded-xl" />
    </div>
  );
};

/**
 * Skeleton for generating image placeholder.
 */
export const GeneratingImageSkeleton = () => {
  return (
    <div className="aspect-square rounded-2xl overflow-hidden bg-surface-container border border-white/5">
      <div className="w-full h-full flex flex-col items-center justify-center">
        <Skeleton variant="rectangular" className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Skeleton variant="circular" width="48px" height="48px" className="mx-auto mb-4" />
            <Skeleton variant="text" height="14px" className="w-24 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
