import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useParameters } from "../context/ParameterContext";

export default function Layout({ children }) {
  const { parameters } = useParameters();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });

  const isRTL = parameters?.modeRTL || false;

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (isRTL) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [isRTL]);

  return (
    <div className={`min-h-screen flex ${isRTL ? 'rtl' : ''}`}> 
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${
        isRTL 
          ? (sidebarCollapsed ? 'right-20' : 'right-64')
          : (sidebarCollapsed ? 'left-20' : 'left-64')
      } hidden lg:flex flex-col`} style={isRTL ? { right: 0, left: 'auto' } : { left: 0 }}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          collapsed={sidebarCollapsed}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed lg:hidden inset-y-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isRTL 
          ? (sidebarOpen ? 'translate-x-0' : 'translate-x-full')
          : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
      }`} style={isRTL ? { right: 0, left: 'auto' } : { left: 0 }}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)} 
          collapsed={false}
        />
      </div>

      {/* Main Content with Navbar */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isRTL
          ? (sidebarCollapsed ? 'lg:mr-20' : 'lg:mr-64')
          : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')
      }`}>
        {/* Navbar - Always at top */}
        <div className="sticky top-0 z-40">
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            onCollapseClick={() => setSidebarCollapsed((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>

        {/* Main content area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
