
import React, { useEffect, useRef } from 'react';
import { StrobeStyle } from '../types';

interface StrobeCanvasProps {
  frequency: number; 
  colors: string[];
  isActive: boolean;
  style: StrobeStyle;
  audioLevel?: number; // 0 to 1
}

const StrobeCanvas: React.FC<StrobeCanvasProps> = ({ 
  frequency, 
  colors, 
  isActive, 
  style,
  audioLevel = 0
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastToggleTimeRef = useRef<number>(0);
  const colorIndexRef = useRef<number>(0);
  const isOnRef = useRef<boolean>(false);

  useEffect(() => {
    let requestHandle: number;

    const animate = (time: number) => {
      if (!isActive || !canvasRef.current) {
        if (canvasRef.current) canvasRef.current.style.backgroundColor = '#000000';
        return;
      }

      let effectiveFreq = frequency;
      if (style === StrobeStyle.AUDIO) {
        effectiveFreq = audioLevel * 60; // Up to 60Hz
      }

      const cycleMs = effectiveFreq > 0 ? 1000 / (effectiveFreq * 2) : Infinity;

      if (style === StrobeStyle.RANDOM) {
        if (Math.random() < (effectiveFreq / 60)) {
          isOnRef.current = !isOnRef.current;
          if (isOnRef.current) colorIndexRef.current = Math.floor(Math.random() * colors.length);
        }
      } else if (effectiveFreq > 0) {
        if (time - lastToggleTimeRef.current >= cycleMs) {
          isOnRef.current = !isOnRef.current;
          lastToggleTimeRef.current = time;
          if (isOnRef.current) {
            colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
          }
        }
      } else {
        isOnRef.current = false;
      }

      const color = isOnRef.current ? colors[colorIndexRef.current] : '#000000';
      canvasRef.current.style.backgroundColor = color;
      
      requestHandle = requestAnimationFrame(animate);
    };

    if (isActive) {
      requestHandle = requestAnimationFrame(animate);
    } else {
      if (canvasRef.current) canvasRef.current.style.backgroundColor = '#000000';
    }

    return () => {
      if (requestHandle) cancelAnimationFrame(requestHandle);
    };
  }, [frequency, isActive, colors, style, audioLevel]);

  return (
    <div 
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ 
        backgroundColor: '#000000',
        transition: style === StrobeStyle.PULSE ? 'background-color 0.15s ease-in-out' : 'none'
      }}
    />
  );
};

export default StrobeCanvas;
