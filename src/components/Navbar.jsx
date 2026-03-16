import { Bell, Menu, User, ChevronDown, PanelLeftClose, PanelLeft, Sun, Moon, Monitor, X, Check } from "lucide-react";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Navbar({ onMenuClick, onCollapseClick, sidebarCollapsed }) {
  const { user, logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'light'
    return localStorage.getItem("theme") || "light";
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifTab, setNotifTab] = useState("all"); // "all" or "unread"
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const themeRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const lu = notifTab === "unread" ? false : undefined;
      const response = await API.get("/notifications", {
        params: { lu, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.notifications || response.data.data?.notifications || [];
    } catch (error) {
      console.error("Erreur notifications:", error);
      return [];
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/notifications/count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.count || 0;
    } catch (error) {
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
    fetchUnreadCount().then(count => setUnreadCount(count));
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount().then(count => setUnreadCount(count));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/notifications/${id}/lue`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications().then(data => setNotifications(data));
      fetchUnreadCount().then(count => setUnreadCount(count));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.patch("/notifications/toutes-lues", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications().then(data => setNotifications(data));
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
        return <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
      case "auto":
        return <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
      default:
        return <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
    }
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setShowThemeMenu(false);
  };

  // Apply theme to document
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

    // Listen for system theme changes when in auto mode
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

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
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 dark:bg-gray-800 dark:border-gray-700">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onCollapseClick}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          title={sidebarCollapsed ? "Développer le menu" : "Réduire le menu"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <PanelLeftClose className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
            title="Thème"
          >
            {getThemeIcon()}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => handleSetTheme("light")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${theme === "light" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
              >
                <Sun className="w-4 h-4" />
                Clair
                {theme === "light" && <Check className="w-4 h-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleSetTheme("dark")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${theme === "dark" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
              >
                <Moon className="w-4 h-4" />
                Sombre
                {theme === "dark" && <Check className="w-4 h-4 ml-auto" />}
              </button>
              <button
                onClick={() => handleSetTheme("auto")}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${theme === "auto" ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}
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
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
              {/* Header */}
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {/* Tabs */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setNotifTab("all")}
                    className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
                      notifTab === "all"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setNotifTab("unread")}
                    className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
                      notifTab === "unread"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    Non lues {unreadCount > 0 && `(${unreadCount})`}
                  </button>
                </div>
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer ${
                        !notif.lu ? "bg-orange-50 dark:bg-gray-700" : ""
                      }`}
                      onClick={() => {
                        if (!notif.lu) {
                          markAsRead(notif.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notif.lu ? "bg-gray-300" : "bg-orange-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {notif.titre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {user?.avatar || user?.photo ? (
                <img
                  src={user.avatar || user.photo}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full flex items-center justify-center bg-orange-500 text-white font-medium ${user?.avatar || user?.photo ? 'hidden' : ''}`}
                style={user?.avatar || user?.photo ? {display: 'none'} : {display: 'flex'}}
              >
                {user?.nom ? user.nom.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.nom || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role ? getRoleLabel(user.role) : ""}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block dark:text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 dark:bg-gray-800 dark:border-gray-700">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.nom}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.telephone}</p>
              </div>
              <button 
                onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Profil
              </button>
              <button 
                onClick={logout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
