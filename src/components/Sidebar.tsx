import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Inbox, Package, FileText, Users, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { path: '/dashboard', label: user.role === 'employee' ? 'My RIS Records' : 'Dashboard', icon: Home, roles: ['employee', 'admin', 'admin_administrative', 'superadmin'] },
    { path: '/inventory', label: 'Inventory Management', icon: Package, roles: ['admin_administrative', 'superadmin'] },
    { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin', 'admin_administrative'] },
  ];

  return (
    <aside className="w-64 bg-[#1A2340] text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">
          RIS
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">RIS Portal</h1>
          <p className="text-[10px] text-white/40">Appendix 63 System</p>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 py-2">
          Menu
        </div>
        {navItems.filter(item => item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors mb-1 relative ${
                isActive ? 'bg-blue-600/30 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-blue-500 rounded-r" />}
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user.full_name}</p>
            <p className="text-[10px] text-white/40 truncate">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm w-full transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
