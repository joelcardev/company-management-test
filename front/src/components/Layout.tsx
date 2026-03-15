import { Outlet } from 'react-router-dom';
import { Building2, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Layout = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // default dark
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="container">
      <header className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
            display: 'flex'
          }}>
            <Building2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Gestão Corp</h1>
        </div>
        
        <button 
          onClick={toggleTheme} 
          className="btn-icon" 
          aria-label="Alternar tema"
          style={{ width: '40px', height: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          {isDarkMode ? <Sun size={20} color="#fcd34d" /> : <Moon size={20} color="#64748b" />}
        </button>
      </header>

      <main className="animate-fade-in" style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 0 1rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--surface-border)',
        marginTop: '3rem'
      }}>
        Gestão Corp © {new Date().getFullYear()} — Sistema de Gerenciamento de Empresas
      </footer>
    </div>
  );
};
