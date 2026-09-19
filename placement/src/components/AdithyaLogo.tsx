import React from 'react';
import { ADITHYA_LOGO_BASE64 } from '../assets/images/adithyaLogoBase64';

interface AdithyaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function AdithyaLogo({ className = '', size = 'xl' }: AdithyaLogoProps) {
  // Medium compact logo width: ~155px maintaining natural aspect ratio
  const sizeClasses = {
    sm: 'w-[120px] h-auto',
    md: 'w-[155px] h-auto',
    lg: 'w-[185px] h-auto',
    xl: 'w-[215px] h-auto',
    '2xl': 'w-[250px] h-auto'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <img
        src="/adithya_logo.png"
        alt="Adithya Institute of Technology"
        className="w-full h-auto object-contain block select-none"
        style={{
          opacity: 1,
          filter: 'none',
          mixBlendMode: 'normal',
          imageRendering: '-webkit-optimize-contrast'
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== ADITHYA_LOGO_BASE64) {
            target.src = ADITHYA_LOGO_BASE64;
          }
        }}
      />
    </div>
  );
}

export const ADITHYA_LOGO_SVG_DATA_URL = ADITHYA_LOGO_BASE64;
