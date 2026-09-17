import React from 'react';
import collegeWatermarkImg from '../assets/images/college_watermark_1784816188589.jpg';

interface WatermarkBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function WatermarkBackground({ className = '', opacity = 0.08 }: WatermarkBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      style={{
        backgroundImage: `url(${collegeWatermarkImg})`,
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        opacity: opacity
      }}
      aria-hidden="true"
    />
  );
}

