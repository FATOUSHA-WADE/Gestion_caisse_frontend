import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  Bell, 
  PanelLeftClose,
  PanelLeft,
  ChevronDown, 
  Sun, 
  Moon, 
  Monitor,
  X,
  Check,
  LogOut,
  User
} from "lucide-react";
import API from "../api/axios";

export default function Navbar({ onMenuClick, onCollapseClick, sidebarCollapsed }) {
  const { user, logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifTab, setNotifTab] = useState("all");
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const themeRef = useRef(null);
  const userMenuRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];
      const lu = notifTab === "unread" ? false : undefined;
      const response = await API.get("/notifications", {
        params: { lu, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.notifications || response.data.data?.notifications || [];
    } catch (error) {
      if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED" || 
          error.message?.includes("Network Error") || error.message?.includes("Connection closed")) {
        return [];
      }
      console.error("Erreur notifications:", error);
      return [];
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return 0;
      const response = await API.get("/notifications/count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.count || 0;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED" || 
          error.message?.includes("Network Error") || error.message?.includes("Connection closed")) {
        return 0;
      }
      console.error("Erreur count:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications().then(data => setNotifications(data));
    }
  }, [showNotifications, notifTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount().then(count => setUnreadCount(count));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUnreadCount().then(count => setUnreadCount(count));
  }, []);

  // SSE pour les notifications en temps réel
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?.id) return;

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/notifications/sse/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Notification reçue:', data);
        // Incrémenter le compteur de notifications non lues
        setUnreadCount(prev => prev + 1);
        // Mettre à jour la liste si le panneau est ouvert
        if (showNotifications) {
          fetchNotifications().then(data => setNotifications(data));
        }
      } catch (e) {
        console.log('[SSE] Message:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.log('[SSE] Erreur, reconnexion...');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.patch("/notifications/toutes-lues", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications().then(data => setNotifications(data));
      fetchUnreadCount().then(count => setUnreadCount(count));
    } catch (error) {
      if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED" || 
          error.message?.includes("Network Error") || error.message?.includes("Connection closed")) {
        return;
      }
      console.error("Erreur:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    const notif = notifications.find(n => n.id === notificationId);
    if (!notif || notif.lu) return;
    
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/notifications/${notificationId}/lue`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, lu: true } : n
      );
      setNotifications(updatedNotifications);
      fetchUnreadCount().then(count => setUnreadCount(count));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: "Administrateur",
      gerant: "Gérant",
      caissier: "Caissier"
    };
    return roles[role] || role;
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="w-5 h-5" />;
      case "auto":
        return <Monitor className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "dark":
        return "Sombre";
      case "auto":
        return "Auto";
      default:
        return "Clair";
    }
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setShowThemeMenu(false);
  };

  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "auto") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const getInitials = (nom) => {
    if (!nom) return "?";
    const words = nom.trim().split(" ");
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return nom.charAt(0).toUpperCase();
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm h-14 flex items-center px-4 lg:px-6 transition-colors duration-200">
      {/* Left - Toggle Sidebar */}
      <div className="flex items-center">
        {/* Mobile - Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Menu"
        >
          <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        {/* Desktop - Collapse Toggle Button */}
        <button
          onClick={onCollapseClick}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={sidebarCollapsed ? "Ouvrir le menu" : "Fermer le menu"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Center - Empty space */}
      <div className="flex-grow"></div>

      {/* Right - Icons & Profile */}
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Theme Toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={getThemeLabel()}
          >
            {getThemeIcon()}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fadeIn">
              <button
                onClick={() => handleSetTheme("light")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === "light" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
              >
                <Sun className="w-4 h-4" />
                Clair
                {theme === "light" && <Check className="w-4 h-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleSetTheme("dark")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === "dark" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
              >
                <Moon className="w-4 h-4" />
                Sombre
                {theme === "dark" && <Check className="w-4 h-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleSetTheme("auto")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === "auto" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
              >
                <Monitor className="w-4 h-4" />
                Auto
                {theme === "auto" && <Check className="w-4 h-4 ml-auto" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                setUnreadCount(0);
              }
            }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setNotifTab("all")}
                    className={`px-3 py-1 text-xs rounded-full ${notifTab === "all" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setNotifTab("unread")}
                    className={`px-3 py-1 text-xs rounded-full ${notifTab === "unread" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                  >
                    Non lues
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${notif.lu === false ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notif.lu === false ? "bg-orange-500" : "bg-transparent"}`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 dark:text-white">{notif.titre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {unreadCount > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={markAllAsRead}
                    className="w-full text-center text-sm text-orange-500 hover:text-orange-600"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium text-sm">
              {getInitials(user?.nom)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.nom || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role ? getRoleLabel(user.role) : ""}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.nom}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.telephone}</p>
              </div>
              <button 
                onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profil
              </button>
              <button 
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
