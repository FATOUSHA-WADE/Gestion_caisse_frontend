import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FolderTree, 
  Receipt,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  BarChart3,
  X,
  Settings
} from "lucide-react";
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ onClose, collapsed }) {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubmenu = (menuLabel) => {
    if (collapsed) return;
    setExpandedMenu(expandedMenu === menuLabel ? null : menuLabel);
  };

  // Define menu items based on role
  const getMenuItems = () => {
    const role = user?.role;
    
    // Common menu items for all roles
    const commonItems = [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ];

    // Admin - full access
    if (role === 'admin') {
      return [
        ...commonItems,
        { path: "/produits", label: "Produits", icon: Package },
        { path: "/categories", label: "Catégories", icon: FolderTree },
        {
          label: "Vente",
          icon: ShoppingCart,
          isSubmenu: true,
          submenu: [
            { path: "/ventes", label: "Point de vente", icon: ShoppingCart },
            { path: "/historique-ventes", label: "Historique des ventes", icon: Receipt }
          ]
        },
        { path: "/mouvements-stock", label: "Mouvements Stock", icon: ArrowRightLeft },
        { path: "/rapports", label: "Rapports", icon: BarChart3 },
        { path: "/utilisateurs", label: "Utilisateurs", icon: Users },
        { path: "/settings", label: "Paramètres", icon: Settings },
      ];
    }

    // Gérant - can view sales, stock, reports, but cannot manage users or settings
    if (role === 'gerant') {
      return [
        ...commonItems,
        { path: "/produits", label: "Produits", icon: Package },
        {
          label: "Vente",
          icon: ShoppingCart,
          isSubmenu: true,
          submenu: [
            { path: "/ventes", label: "Point de vente", icon: ShoppingCart },
            { path: "/historique-ventes", label: "Historique des ventes", icon: Receipt }
          ]
        },
        { path: "/mouvements-stock", label: "Mouvements Stock", icon: ArrowRightLeft },
        { path: "/rapports", label: "Rapports", icon: BarChart3 },
      ];
    }

    // Caissier - simplified interface for making sales
    if (role === 'caissier') {
      return [
        ...commonItems,
        { path: "/produits", label: "Produits", icon: Package },
        {
          label: "Vente",
          icon: ShoppingCart,
          isSubmenu: true,
          submenu: [
            { path: "/ventes", label: "Point de vente", icon: ShoppingCart },
            { path: "/historique-ventes", label: "Mes ventes", icon: Receipt }
          ]
        },
      ];
    }

    // Default - admin menu
    return commonItems;
  };

  const menuItems = getMenuItems();

  const isActive = (path) => location.pathname === path;
  const isSubmenuActive = (submenu) => submenu.some(item => location.pathname === item.path);

  // Width based on collapsed state
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';

  return (
    <aside className={`bg-theme-sidebar text-theme-sidebar h-full flex flex-col ${sidebarWidth} overflow-hidden`}>
      {/* Logo */}
      <div className="p-3 sm:p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-orange-500 p-2 rounded-lg flex-shrink-0">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-orange-500 truncate">GESTICOM</h1>
              <p className="text-xs text-gray-400 truncate">
                {user?.role === 'admin' && 'Administrateur'}
                {user?.role === 'gerant' && 'Gérant'}
                {user?.role === 'caissier' && 'Caissier'}
              </p>
            </div>
          )}
        </div>
        {/* Mobile close button */}
        <button 
          onClick={onClose} 
          className="lg:hidden p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-2 sm:py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path || item.label}>
              {item.isSubmenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`flex items-center justify-between w-full gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                      isSubmenuActive(item.submenu)
                        ? "bg-theme-active text-white"
                        : "text-theme-sidebar hover-theme-sidebar"
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {(!collapsed || !item.isSubmenu) && (
                        <span className="font-medium truncate sidebar-label">{item.label}</span>
                      )}
                    </div>
                    {!collapsed && (
                      expandedMenu === item.label ? 
                        <ChevronDown className="w-4 h-4 flex-shrink-0" /> : 
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  {!collapsed && expandedMenu === item.label && (
                    <ul className="ml-4 sm:ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            onClick={onClose}
                            className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg transition-colors ${
                              isActive(subItem.path)
                                ? "bg-theme-active text-white"
                                : "text-theme-sidebar hover-theme-sidebar"
                            }`}
                          >
                            <subItem.icon className="w-4 h-4 flex-shrink-0" />
                            {(!collapsed) && (
                              <span className="font-medium text-sm truncate sidebar-label">{subItem.label}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-theme-active text-white"
                      : "text-theme-sidebar hover-theme-sidebar"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || !item.isSubmenu) && (
                    <span className="font-medium truncate sidebar-label">{item.label}</span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
