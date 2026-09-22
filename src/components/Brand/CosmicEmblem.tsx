import React from 'react';

export const CosmicRocketEmblem: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Saturn Ring */}
        <ellipse
          cx="38"
          cy="68"
          rx="24"
          ry="8"
          transform="rotate(-20 38 68)"
          fill="#E0E7FF"
          stroke="#818CF8"
          strokeWidth="3"
        />
        {/* Saturn Planet */}
        <circle cx="38" cy="68" r="14" fill="url(#saturnGradient)" />
        <ellipse
          cx="38"
          cy="68"
          rx="24"
          ry="8"
          transform="rotate(-20 38 68)"
          stroke="#4338CA"
          strokeWidth="2.5"
          strokeDasharray="24 40"
        />

        {/* Golden Star Trail */}
        <path
          d="M 20 80 Q 45 40 75 22"
          stroke="#FBBF24"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />

        {/* Sparkling Stars */}
        <path
          d="M 28 45 L 30 40 L 32 45 L 37 47 L 32 49 L 30 54 L 28 49 L 23 47 Z"
          fill="#F59E0B"
        />
        <path
          d="M 60 25 L 61 22 L 62 25 L 65 26 L 62 27 L 61 30 L 60 27 L 57 26 Z"
          fill="#FBBF24"
        />

        {/* Playful Rocket Body */}
        <g transform="translate(62, 12) rotate(40)">
          {/* Flame */}
          <path d="M 8 26 Q 12 36 12 40 Q 6 36 8 26 Z" fill="#F43F5E" />
          <path d="M 9 28 Q 11 34 11 37 Q 8 34 9 28 Z" fill="#F59E0B" />
          {/* Fins */}
          <path d="M 2 20 L 8 14 L 8 24 Z" fill="#4338CA" />
          <path d="M 22 20 L 16 14 L 16 24 Z" fill="#4338CA" />
          {/* Body */}
          <path
            d="M 12 2 C 18 2 20 12 20 24 L 4 24 C 4 12 6 2 12 2 Z"
            fill="#FFFFFF"
            stroke="#6366F1"
            strokeWidth="2"
          />
          {/* Nosecone */}
          <path d="M 12 2 C 16 2 18 8 18 11 L 6 11 C 6 8 8 2 12 2 Z" fill="#6366F1" />
          {/* Porthole Window */}
          <circle cx="12" cy="17" r="3.5" fill="#38BDF8" stroke="#4338CA" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};

export const TeacherAstronautAvatar: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        {/* Glow */}
        <circle cx="50" cy="50" r="46" fill="#EEF2FF" />

        {/* Helmet Base */}
        <circle cx="50" cy="46" r="32" fill="#FFFFFF" stroke="#4338CA" strokeWidth="4" />

        {/* Purple Helmet Trim & Collar */}
        <path
          d="M 25 65 C 25 55 75 55 75 65 C 75 80 25 80 25 65 Z"
          fill="#6366F1"
        />
        <path
          d="M 30 75 Q 50 88 70 75 L 75 92 Q 50 98 25 92 Z"
          fill="#4338CA"
        />

        {/* Gold Visor Shield */}
        <ellipse cx="50" cy="44" rx="23" ry="17" fill="url(#goldVisorGradient)" stroke="#F59E0B" strokeWidth="2.5" />

        {/* Visor Glint Reflection */}
        <ellipse cx="42" cy="38" rx="8" ry="4" transform="rotate(-15 42 38)" fill="#FFFFFF" opacity="0.6" />

        {/* Friendly Face / Smile Behind Glass */}
        <circle cx="43" cy="44" r="2.5" fill="#312E81" />
        <circle cx="57" cy="44" r="2.5" fill="#312E81" />
        <path d="M 45 50 Q 50 54 55 50" stroke="#312E81" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Golden Star Emblem on Chest */}
        <path
          d="M 50 78 L 52 82 L 56 82 L 53 84 L 54 88 L 50 85 L 46 88 L 47 84 L 44 82 L 48 82 Z"
          fill="#FBBF24"
        />

        <defs>
          <linearGradient id="saturnGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="goldVisorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
