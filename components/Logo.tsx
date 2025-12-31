
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', light = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* The Lattice Mark - Geometric S + Hanger + Network */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <path 
          d="M30 25C30 25 45 15 50 15C55 15 70 25 70 25L85 45H15L30 25Z" 
          fill={light ? "white" : "currentColor"} 
          className="dark:fill-white"
          fillOpacity="0.2"
        />
        <path 
          d="M20 50C20 40 30 35 40 35H60C70 35 80 40 80 50V70C80 80 70 85 60 85H40C30 85 20 80 20 70V50Z" 
          stroke={light ? "white" : "currentColor"} 
          className="dark:stroke-white transition-colors duration-300"
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <path 
          d="M40 55L60 65M40 65L60 55" 
          stroke={light ? "white" : "currentColor"} 
          // Combined duplicate className attributes into a single attribute
          className="dark:stroke-white transition-colors duration-300 animate-pulse"
          strokeWidth="4" 
          strokeLinecap="round"
        />
        <circle 
          cx="50" 
          cy="15" 
          r="5" 
          fill="#4F46E5"
        />
      </svg>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 -z-10" />
    </div>
  );
};

export default Logo;
