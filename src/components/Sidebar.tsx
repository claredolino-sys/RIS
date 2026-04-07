import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Inbox, Package, FileText, Users, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const navItems = [
    { path: '/dashboard', label: user.role === 'employee' ? 'My RIS Records' : 'Dashboard', icon: Home, roles: ['employee', 'admin', 'admin_administrative', 'superadmin'] },
    { path: '/admin-inbox', label: 'Admin Inbox', icon: Inbox, roles: ['admin', 'admin_administrative'] },
    { path: '/inventory', label: 'Inventory Management', icon: Package, roles: ['admin', 'admin_administrative', 'superadmin'] },
    { path: '/approved-ris', label: 'Approved RIS', icon: FileText, roles: ['superadmin'] },
    { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'admin_administrative'] },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1A2340] text-white flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-blue-600 rounded-full p-1 text-white shadow-lg z-10 hover:bg-blue-700 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`p-4 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold flex-shrink-0">
          RIS
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-sm leading-tight">RIS Portal</h1>
            <p className="text-[10px] text-white/40">Appendix 63 System</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 py-2">
            Menu
          </div>
        )}
        {navItems.filter(item => item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors mb-1 relative ${
                isActive ? 'bg-blue-600/30 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-blue-500 rounded-r" />}
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4`}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {user.full_name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-semibold truncate">{user.full_name}</p>
              <p className="text-[10px] text-white/40 truncate">{user.role.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          title={isCollapsed ? 'Logout' : ''}
          className={`flex items-center gap-2 text-white/60 hover:text-white text-sm w-full transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
