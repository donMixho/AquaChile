import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AQUACHILE_THEME } from '../theme';
import LogoAquaChile from './LogoAquaChile';

const Layout = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Solicitudes', path: '/solicitudes' },
    { name: 'Candidatos', path: '/candidatos' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: AQUACHILE_THEME.background,
      color: AQUACHILE_THEME.text,
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Barra de Navegación con Efecto Cristal / Glassmorphism */}
      <header style={{
        background: 'rgba(2, 17, 32, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${AQUACHILE_THEME.surfaceBorder || 'rgba(0, 242, 254, 0.22)'}`,
        boxShadow: '0 4px 28px rgba(0, 242, 254, 0.1)',
        padding: '0 32px',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        
        {/* LOGO AQUACHILE MEJORADO */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <LogoAquaChile />
        </Link>

        {/* Links de Navegación */}
        <nav style={{ display: 'flex', gap: '12px' }}>
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  padding: '9px 20px',
                  borderRadius: '24px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: isActive ? '#021120' : AQUACHILE_THEME.textMuted || '#94B4CB',
                  background: isActive
                    ? (AQUACHILE_THEME.glowButton || 'linear-gradient(135deg, #00F2FE 0%, #008289 100%)')
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActive ? '0 0 16px rgba(0, 242, 254, 0.45)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Contenedor Principal */}
      <main style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <Outlet />
      </main>

      {/* Footer Minimalista */}
      <footer style={{
        textAlign: 'center',
        padding: '18px',
        fontSize: '12px',
        color: AQUACHILE_THEME.textMuted || '#94B4CB',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(2, 17, 32, 0.95)'
      }}>
        AquaChile S.A. &copy; 2026 • Sistema de Evaluación Psicolaboral Automatizado
      </footer>
    </div>
  );
};

export default Layout;