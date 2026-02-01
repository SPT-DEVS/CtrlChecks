import React from 'react';

interface GlassBlurLoaderProps {
  /** Optional text to display below the loader */
  text?: string;
  /** Optional description text */
  description?: string;
  /** Number of dots in the circle (8-12) */
  dotCount?: number;
  /** Custom className for the overlay */
  className?: string;
}

export function GlassBlurLoader({ 
  text = 'Loading...', 
  description,
  dotCount = 10,
  className = ''
}: GlassBlurLoaderProps) {
  // Ensure dotCount is between 8 and 12
  const dots = Math.max(8, Math.min(12, dotCount));
  
  // Calculate angle for each dot to form a perfect circle
  const radius = 24; // Circle radius in pixels
  const dotSize = 6; // Size of each dot
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Dotted Circle Loader */}
        <div className="relative" style={{ width: radius * 2 + dotSize, height: radius * 2 + dotSize }}>
          {Array.from({ length: dots }).map((_, index) => {
            // Calculate position for each dot in a circle
            const angle = (index * 360) / dots - 90; // Start from top (-90 degrees)
            const radian = (angle * Math.PI) / 180;
            const x = radius + radius * Math.cos(radian);
            const y = radius + radius * Math.sin(radian);
            
            // Animation delay for each dot (staggered fade effect)
            const delay = (index * 0.8) / dots;
            
            return (
              <div
                key={index}
                className="absolute rounded-full"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  left: `${x}px`,
                  top: `${y}px`,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translate(-50%, -50%)',
                  animation: `dotPulse 0.9s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
        
        {/* Optional Text */}
        {text && (
          <div className="text-center space-y-2">
            <p 
              className="text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {text}
            </p>
            {description && (
              <p 
                className="text-xs max-w-md mx-auto"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* CSS Animation for dot pulse - only fade/pulse, no rotation or movement */}
      <style>{`
        @keyframes dotPulse {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

