import React, { useState } from 'react';
import logoImg from '../assets/images/ives_ios_icon_1785631186938.jpg';
import pwaIcon from '../assets/images/pwa_icon_large_1784379537025.jpg';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', size = 'sm', alt = "Ives Logo" }) => {
  const [errorCount, setErrorCount] = useState(0);

  // Fallback sources in order of preference
  const sources = [
    logoImg,
    pwaIcon,
    '/icon_192.png',
    '/ives-logo.jpg',
    '/apple-touch-icon.png'
  ];

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl'
  };

  const currentSrc = sources[errorCount];

  // If all image sources fail (e.g. offline/blocked), render a high-res SVG logo badge
  if (errorCount >= sources.length || !currentSrc) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} bg-neutral-900 border border-neutral-800 shadow-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden select-none`}
        title="Ives' Podcast"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="20" fill="#18181B"/>
          <circle cx="50" cy="50" r="30" fill="#007AFF" fillOpacity="0.2"/>
          <path d="M50 25V75M38 35V65M62 35V65M26 42V58M74 42V58" stroke="#007AFF" strokeWidth="6" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${sizeClasses[size]} ${className} object-cover shadow-sm border border-neutral-200/50 dark:border-neutral-700/50 flex-shrink-0 select-none`}
      onError={() => {
        setErrorCount((prev) => prev + 1);
      }}
    />
  );
};

export default AppLogo;
