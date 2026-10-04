import React from 'react';

const LogoAquaChile = ({ size = 'medium' }) => {
  const isSmall = size === 'small';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '10px' : '14px', textDecoration: 'none' }}>
      {/* Isotipo Vectorial AquaChile con degradado y resplandor */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.45))'
      }}>
        <svg
          width={isSmall ? "36" : "44"}
          height={isSmall ? "36" : "44"}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="aquaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="60%" stopColor="#008289" />
              <stop offset="100%" stopColor="#004D61" />
            </linearGradient>
            <linearGradient id="salmonFin" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF7E5F" />
              <stop offset="100%" stopColor="#FEB47B" />
            </linearGradient>
            <filter id="subtleBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00F2FE" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Anillo de cristal exterior */}
          <circle cx="50" cy="50" r="46" stroke="rgba(0, 242, 254, 0.25)" strokeWidth="2" fill="rgba(2, 17, 32, 0.6)" />

          {/* Silueta hidrodinámica del pez / flecha AquaChile */}
          {/* Cuerpo principal en movimiento */}
          <path
            d="M 22 50 C 35 34, 62 38, 78 50 C 62 62, 35 66, 22 50 Z"
            fill="url(#aquaGlow)"
            filter="url(#subtleBlur)"
          />

          {/* Aleta dorsal aerodinámica */}
          <path
            d="M 44 41 C 52 30, 65 34, 68 45 C 58 45, 50 43, 44 41 Z"
            fill="rgba(0, 255, 178, 0.85)"
          />

          {/* Cola estilizada de propulsión */}
          <path
            d="M 24 50 L 14 36 C 18 45, 18 55, 14 64 Z"
            fill="url(#salmonFin)"
          />

          {/* Ojo / Destello guía */}
          <circle cx="68" cy="48" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Tipografía Corporativa Oficial AquaChile */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          <span style={{
            fontSize: isSmall ? '18px' : '22px',
            fontWeight: '900',
            letterSpacing: '0.8px',
            background: 'linear-gradient(90deg, #FFFFFF 30%, #00F2FE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'none',
            fontFamily: "'Montserrat', 'Segoe UI', sans-serif"
          }}>
            Aqua
          </span>
          <span style={{
            fontSize: isSmall ? '18px' : '22px',
            fontWeight: '400',
            letterSpacing: '0.8px',
            color: '#00F2FE',
            fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
            marginLeft: '1px'
          }}>
            Chile
          </span>
        </div>

        {/* Subtítulo Tecnológico del MVP */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '3px'
        }}>
          <span style={{
            fontSize: '10px',
            color: '#00FFB2',
            fontWeight: '700',
            letterSpacing: '1.2px',
            textTransform: 'uppercase'
          }}>
            Reclutamiento & Selección
          </span>
          <span style={{
            fontSize: '9px',
            background: 'rgba(0, 242, 254, 0.2)',
            color: '#00F2FE',
            padding: '1px 5px',
            borderRadius: '4px',
            fontWeight: '800',
            border: '1px solid rgba(0, 242, 254, 0.3)'
          }}>
            MVP
          </span>
        </div>
      </div>
    </div>
  );
};

export default LogoAquaChile;