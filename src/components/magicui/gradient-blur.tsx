"use client";

import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

interface GradientBlurProps {
  className?: string;
  children?: React.ReactNode;
  colors?: string[];
  blur?: number;
  size?: number;
  animate?: boolean;
}

export const GradientBlur: React.FC<GradientBlurProps> = ({
  className,
  children,
  colors = ["#FF3366", "#D4AF37", "#9CAF88"],
  blur = 100,
  size = 400,
  animate = true,
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Animated gradient orbs */}
      {animate && (
        <>
          <motion.div
            className="absolute rounded-full opacity-70 mix-blend-multiply"
            style={{
              width: size,
              height: size,
              background: `radial-gradient(circle, ${colors[0]}40 0%, transparent 70%)`,
              filter: `blur(${blur}px)`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute rounded-full opacity-70 mix-blend-multiply"
            style={{
              width: size * 0.8,
              height: size * 0.8,
              background: `radial-gradient(circle, ${colors[1]}40 0%, transparent 70%)`,
              filter: `blur(${blur * 0.8}px)`,
              right: 0,
            }}
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute rounded-full opacity-70 mix-blend-multiply"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              background: `radial-gradient(circle, ${colors[2]}40 0%, transparent 70%)`,
              filter: `blur(${blur * 0.6}px)`,
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
            }}
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};