
import React, { useEffect, useRef, useState } from 'react';
import { StrobeStyle } from '../types';

interface StrobeCanvasProps {
  frequency: number; 
  colors: string[];
  isActive: boolean;
  intensity: number;
  style: StrobeStyle;
  audioLevel?: number; // 0 to 1
}

const StrobeCanvas: React.FC<StrobeCanvasProps> = ({ 
  frequency, 
  colors, 
  isActive, 
  intensity, 
  style,
  audioLevel = 0
}) => {
  const requestRef = useRef<number>();
  const lastToggleTimeRef = useRef<number>(0);
  const colorIndexRef = useRef<number>(0);
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    const animate = (time: number) => {
      if (!isActive) {
        setIsOn(false);
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      // Determine the effective frequency based on style
      let effectiveFreq = frequency;
      
      if (style === StrobeStyle.AUDIO) {
        // Map audio level (0-1) to frequency (e.g., 0Hz to 40Hz)
        effectiveFreq = audioLevel * 50;
      }

      const cycleMs = 1000 / (effectiveFreq * 2);

      if (style === StrobeStyle.RANDOM) {
        // Randomly decide to toggle if threshold met
        if (Math.random() < (effectiveFreq / 60)) {
          setIsOn(prev => !prev);
          if (!isOn) colorIndexRef.current = Math.floor(Math.random() * colors.length);
        }
      } else if (effectiveFreq > 0) {
        if (time - lastToggleTimeRef.current >= cycleMs) {
          setIsOn((prev) => !prev);
          lastToggleTimeRef.current = time;
          if (!isOn) {
            colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
          }
        }
      } else {
        setIsOn(false);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [frequency, isActive, isOn, colors, style, audioLevel]);

  const currentColor = isOn ? colors[colorIndexRef.current] : '#000000';

  return (
    <div 
      className="fixed inset-0 z-0"
      style={{ 
        backgroundColor: currentColor,
        opacity: intensity,
        // Smooth transition for PULSE style
        transition: style === StrobeStyle.PULSE ? 'background-color 0.2s ease-in-out' : 'none'
      }}
    />
  );
};

export default StrobeCanvas;
