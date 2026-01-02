
import React, { useEffect, useRef, useState } from 'react';

interface StrobeCanvasProps {
  frequency: number; // Hz (Flashes per second)
  colors: string[];
  isActive: boolean;
  intensity: number; // 0 to 1
}

const StrobeCanvas: React.FC<StrobeCanvasProps> = ({ frequency, colors, isActive, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

      const cycleMs = 1000 / (frequency * 2); // Split Hz into On/Off phases
      if (time - lastToggleTimeRef.current >= cycleMs) {
        setIsOn((prev) => !prev);
        lastToggleTimeRef.current = time;
        
        // Change color when turning "On"
        if (!isOn) {
          colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [frequency, isActive, isOn, colors.length]);

  const currentColor = isOn ? colors[colorIndexRef.current] : '#000000';

  return (
    <div 
      className="fixed inset-0 z-0 transition-colors duration-0"
      style={{ 
        backgroundColor: currentColor,
        opacity: intensity 
      }}
    />
  );
};

export default StrobeCanvas;
