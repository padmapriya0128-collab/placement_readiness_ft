import React from 'react';

interface AdithyaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AdithyaLogo({ className = '', size = 'md' }: AdithyaLogoProps) {
  const sizeClasses = {
    sm: 'h-14',
    md: 'h-24',
    lg: 'h-32',
    xl: 'h-40'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="-160 -125 320 250"
        className="h-full w-auto max-h-full"
        style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))' }}
      >
        <g id="logo-graphic">
          {/* 5 Orange Flame Petals */}
          <g fill="#F05123">
            {/* Center Petal */}
            <path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z" />
            {/* Top Left Petal */}
            <g transform="rotate(-38)">
              <path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z" />
            </g>
            {/* Far Left Petal */}
            <g transform="rotate(-76)">
              <path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z" />
            </g>
            {/* Top Right Petal */}
            <g transform="rotate(38)">
              <path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z" />
            </g>
            {/* Far Right Petal */}
            <g transform="rotate(76)">
              <path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z" />
            </g>
          </g>

          {/* Outer Orange Sun Arch */}
          <path
            d="M -64,12 A 64,64 0 1,1 64,12"
            fill="none"
            stroke="#F05123"
            strokeWidth="19"
            strokeLinecap="round"
          />

          {/* Navy Blue 'A' Symbol */}
          <g fill="#15223D">
            {/* Main Outer 'A' Structure */}
            <path d="M 0,-44 L -28,22 L -14,22 L -5,-1 L 5,-1 L 14,22 L 28,22 Z" />
            {/* Inner Triangle Cutout */}
            <path d="M 0,-30 L -7,-4 L 7,-4 Z" fill="#FFFFFF" />
            {/* Bottom Arch Bridge */}
            <path d="M -26,24 A 32,20 0 0,1 26,24 L 16,24 A 20,12 0 0,0 -16,24 Z" />
          </g>
        </g>

        {/* Typography */}
        <g textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">
          {/* ADITHYA */}
          <text
            x="0"
            y="70"
            fontWeight="900"
            fontSize="32"
            letterSpacing="2.5"
            fill="#F05123"
          >
            ADITHYA
          </text>
          {/* INSTITUTE OF TECHNOLOGY */}
          <text
            x="0"
            y="98"
            fontWeight="800"
            fontSize="17.5"
            letterSpacing="1.2"
            fill="#15223D"
          >
            INSTITUTE OF TECHNOLOGY
          </text>
        </g>
      </svg>
    </div>
  );
}

// Clean SVG string as Data URL for PDF Exports
const CLEAN_ADITHYA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-160 -125 320 250" width="320" height="250"><g fill="#F05123"><path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z"/><g transform="rotate(-38)"><path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z"/></g><g transform="rotate(-76)"><path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z"/></g><g transform="rotate(38)"><path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z"/></g><g transform="rotate(76)"><path d="M 0,-115 C 13,-95 12,-73 0,-60 C -12,-73 -13,-95 0,-115 Z"/></g></g><path d="M -64,12 A 64,64 0 1,1 64,12" fill="none" stroke="#F05123" stroke-width="19" stroke-linecap="round"/><g fill="#15223D"><path d="M 0,-44 L -28,22 L -14,22 L -5,-1 L 5,-1 L 14,22 L 28,22 Z"/><path d="M 0,-30 L -7,-4 L 7,-4 Z" fill="#FFFFFF"/><path d="M -26,24 A 32,20 0 0,1 26,24 L 16,24 A 20,12 0 0,0 -16,24 Z"/></g><g text-anchor="middle" font-family="sans-serif"><text x="0" y="70" font-weight="900" font-size="32" letter-spacing="2.5" fill="#F05123">ADITHYA</text><text x="0" y="98" font-weight="800" font-size="17.5" letter-spacing="1.2" fill="#15223D">INSTITUTE OF TECHNOLOGY</text></g></svg>`;

export const ADITHYA_LOGO_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(CLEAN_ADITHYA_LOGO_SVG)}`;
