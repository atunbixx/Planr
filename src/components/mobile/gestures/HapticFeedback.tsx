'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface HapticFeedbackProps {
  children: ReactNode;
  pattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'impact';
  customPattern?: number | number[];
  disabled?: boolean;
  trigger?: 'touch' | 'click' | 'both';
}

export default function HapticFeedback({
  children,
  pattern = 'light',
  customPattern,
  disabled = false,
  trigger = 'both',
}: HapticFeedbackProps) {
  const { vibrate } = useHapticFeedback();

  const handleHaptic = () => {
    if (disabled) return;
    
    if (customPattern) {
      vibrate(customPattern);
    } else {
      vibrate(pattern);
    }
  };

  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  const enhancedProps: any = {};

  if (trigger === 'touch' || trigger === 'both') {
    enhancedProps.onTouchStart = (e: any) => {
      handleHaptic();
      children.props.onTouchStart?.(e);
    };
  }

  if (trigger === 'click' || trigger === 'both') {
    enhancedProps.onClick = (e: any) => {
      handleHaptic();
      children.props.onClick?.(e);
    };
  }

  return cloneElement(children, enhancedProps);
}