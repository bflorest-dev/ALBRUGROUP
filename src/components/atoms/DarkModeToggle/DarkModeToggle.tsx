import React, { useEffect, useState } from 'react';
import { BiMoon, BiSun } from 'react-icons/bi';
import './DarkModeToggle.css';

const THEME_KEY = 'app-theme-preference';

export const DarkModeToggle: React.FC = () => {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) return stored === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      try { localStorage.setItem(THEME_KEY, 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem(THEME_KEY, 'light'); } catch {}
    }
  }, [dark]);

  const toggle = () => setDark((v) => !v);

  return (
    <button
      className={`dm-toggle ${dark ? 'on' : 'off'}`}
      onClick={toggle}
      aria-pressed={dark}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="dm-icon" aria-hidden="true">{dark ? <BiSun /> : <BiMoon />}</span>
      <span className="dm-label">{dark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
};
