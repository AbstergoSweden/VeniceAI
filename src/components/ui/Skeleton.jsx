import React from 'react';
import { motion as Motion } from 'framer-motion';

const Skeleton = ({ className, width, height, ...props }) => {
  return (
    <div
        className={`relative overflow-hidden bg-gray-200/20 rounded-md ${className}`}
        style={{ width, height }}
        {...props}
    >
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
};

export default Skeleton;
