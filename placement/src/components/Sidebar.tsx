import React from 'react';
import { 
  Users, 
  Database, 
  Building2, 
  TrendingUp, 
  UserCheck, 
  History, 
  ShieldCheck, 
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Bell,
  CheckSquare,
  Download,
  Settings,
  LogOut,
  Award,
  User,
  Briefcase,
  Send
} from 'lucide-react';

interface SidebarProps {
  role: 'Faculty' | 'Placement Faculty' | 'Student';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  role,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  isOpen,
  setIsOpen,
  onLogout
}: SidebarProps) {

  const getSidebarItems = () => {
    switch (role) {
      case 'Placement Faculty':
        // Role: Placement Officer
        return [
          { id: 'company-requirements', label: 'Company Requirements', icon: Building2 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'Faculty':
        // Role: Placement Faculty
        return [
          { id: 'students', label: 'Student Registry', icon: Users },
          { id: 'assessments', label: 'Assessments', icon: BookOpen },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      default:
        return [];
    }
  };

  const menuItems = getSidebarItems();


  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 h-screen bg-white text-slate-700 flex flex-col justify-between border-r border-slate-100 transition-all duration-300 z-40 ${
        collapsed ? 'md:w-16' : 'md:w-64'
      } ${
        isOpen ? 'translate-x-0 w-64 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0 w-64'
      }`}
    >
      <div>
        {/* Sidebar Header Brand */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="p-2 bg-blue-600 rounded-xl text-white flex-shrink-0 shadow-sm">
              <ShieldCheck size={20} />
            </span>
            {(!collapsed || isOpen) && (
              <span className="font-bold text-sm tracking-tight text-slate-900 whitespace-nowrap animate-fade-in">
                PRA Portal
              </span>
            )}
          </div>
          {/* Collapse button on Desktop, Close button on Mobile */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="block md:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const isLabelVisible = !collapsed || isOpen;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <IconComponent size={18} className="flex-shrink-0" />
                {isLabelVisible && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Branding & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {onLogout && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to log out?')) {
                onLogout();
              }
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0 text-rose-500" />
            {(!collapsed || isOpen) && <span>Logout</span>}
          </button>
        )}
        {(!collapsed || isOpen) && (
          <div className="px-3 space-y-1">
            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-400">
              <button
                onClick={() => {
                  setActiveTab('privacy');
                  window.history.pushState({}, '', '/privacy');
                }}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              >
                Privacy
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setActiveTab('terms');
                  window.history.pushState({}, '', '/terms');
                }}
                className="hover:text-blue-600 cursor-pointer transition-colors"
              >
                Terms
              </button>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider">
              Adithya Institute of Tech © 2026
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
