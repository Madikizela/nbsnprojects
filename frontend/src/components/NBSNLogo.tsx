import React from 'react';

interface NBSNLogoProps {
  size?: number;
}

const NBSNLogo: React.FC<NBSNLogoProps> = ({ size = 120 }) => {
  return (
    <div 
      className="position-relative mx-auto"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
      }}
    >
      {/* Circular background with gradient */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
        style={{
          background: 'linear-gradient(135deg, #0052CC 0%, #00A3E0 100%)',
          boxShadow: '0 8px 24px rgba(0, 82, 204, 0.3)',
        }}
      />
      
      {/* Brain and Circuit Board Design */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="position-absolute top-0 start-0"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        {/* Left Brain (Organic) */}
        <g transform="translate(40, 100)">
          {/* Brain curves */}
          <path
            d="M 0,-40 Q -15,-50 -20,-35 Q -25,-20 -20,-10 Q -15,0 -10,10 Q -5,20 0,25 Q 5,20 10,10 Q 15,0 20,-10 Q 25,-20 20,-35 Q 15,-50 0,-40 Z"
            fill="white"
            opacity="0.95"
            stroke="white"
            strokeWidth="2"
          />
          {/* Brain details */}
          <circle cx="-8" cy="-15" r="3" fill="#00A3E0" opacity="0.6" />
          <circle cx="8" cy="-15" r="3" fill="#00A3E0" opacity="0.6" />
          <circle cx="0" cy="0" r="3" fill="#00A3E0" opacity="0.6" />
          <circle cx="-5" cy="10" r="2" fill="#00A3E0" opacity="0.6" />
          <circle cx="5" cy="10" r="2" fill="#00A3E0" opacity="0.6" />
        </g>

        {/* Right Circuit Board (Digital) */}
        <g transform="translate(160, 100)">
          {/* Circuit lines */}
          <line x1="-30" y1="-30" x2="0" y2="-30" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          <line x1="0" y1="-30" x2="0" y2="-10" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          <line x1="0" y1="-10" x2="15" y2="-10" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          
          <line x1="-30" y1="0" x2="-10" y2="0" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          <line x1="-10" y1="0" x2="-10" y2="20" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          
          <line x1="-30" y1="20" x2="0" y2="20" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          <line x1="0" y1="20" x2="0" y2="30" stroke="#00E5FF" strokeWidth="3" opacity="0.9" />
          
          {/* Circuit nodes */}
          <circle cx="-30" cy="-30" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="0" cy="-30" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="15" cy="-10" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="-30" cy="0" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="-10" cy="20" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          <circle cx="0" cy="30" r="4" fill="white" stroke="#00E5FF" strokeWidth="2" />
          
          {/* Chip icon */}
          <rect x="-5" y="-5" width="10" height="10" fill="white" opacity="0.9" rx="1" />
          <rect x="-3" y="-3" width="6" height="6" fill="#00A3E0" opacity="0.7" />
        </g>

        {/* Center connecting element */}
        <g transform="translate(100, 100)">
          <circle cx="0" cy="0" r="8" fill="white" opacity="0.95" />
          <circle cx="0" cy="0" r="4" fill="#00E5FF" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
};

export default NBSNLogo;
