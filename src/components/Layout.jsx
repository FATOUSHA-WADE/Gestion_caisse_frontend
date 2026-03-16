import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Initialiser collapsed depuis localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });

  // Sauvegarder collapsed dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  return (
    <div className={`min-h-screen flex ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}> 
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixe, toujours visible à gauche sur desktop */}
      <div className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-20 sidebar-collapsed' : 'w-64'} hidden lg:flex flex-col`} style={{boxShadow: '2px 0 8px rgba(0,0,0,0.03)'}}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Mobile sidebar (toggleable) */}
      <div className={`fixed lg:hidden inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          collapsed={false}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Navbar fixed en haut - Hidden on mobile, visible on lg+ */}
        <div className={`fixed top-0 z-40 transition-all duration-300 hidden lg:block ${
          sidebarCollapsed ? 'left-20' : 'left-64'
        }`} style={{ right: 0 }}>
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            onCollapseClick={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
        
        {/* Mobile navbar - visible only on mobile */}
        <div className="fixed top-0 left-0 right-0 z-40 lg:hidden">
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            onCollapseClick={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
        
        {/* Contenu principal avec padding-top pour compenser la navbar fixe */}
        <div 
          className={
            sidebarCollapsed
              ? 'lg:pl-20 lg:pr-0'
              : 'lg:pl-64 lg:pr-0'
          }
          style={{ paddingTop: '4rem' }}
        >
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto bg-theme-primary min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
