import { useEffect, useState } from 'react';
import { APP_CONFIG } from '@/config/app.js';
import Sidebar from './Sidebar.jsx';
import './MainLayout.scss';

export default function MainLayout({ title, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.title = `${title} · ${APP_CONFIG.name}`;
  }, [title]);

  return (
    <div className={`app-shell${sidebarCollapsed ? ' app-shell--collapsed' : ''}`}>
      <a className="skip-link" href="#workplace">Перейти к рабочему месту</a>
      <header className="site-header" aria-label="Шапка сайта" />
      <div className="app-shell__body">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />
        <main className="app-shell__main" id="workplace" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
