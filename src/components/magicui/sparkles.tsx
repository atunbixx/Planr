"use client";

import { cn } from '@/utils/cn';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface SparklesProps {
  className?: string;
  color?: string;
  count?: number;
  speed?: number;
}

export const Sparkles: React.FC<SparklesProps> = ({
  className,
  color = "#D4AF37",
  count = 50,
  speed = 1,
}) => {
  const sparkles = useRef<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    sparkles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 2,
    }));
  }, [count]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {sparkles.current.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 / speed,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};