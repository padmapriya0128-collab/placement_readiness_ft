import React, { useState } from 'react';
import { Bell, Search, LogOut, ShieldAlert, Check, Menu, User } from 'lucide-react';
import { AppNotification } from '../types';

interface HeaderProps {
  user: any;
  role: 'Faculty' | 'Placement Faculty' | 'Student';
  onLogout: () => void;
  onSearch?: (term: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onToggleSidebar?: () => void;
}

export default function Header({
  user,
  role,
  onLogout,
  onSearch,
  notifications,
  setNotifications,
  onToggleSidebar
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <span className="p-1 rounded-full bg-emerald-50 text-emerald-500 font-bold text-xs">✓</span>;
      case 'warning':
        return <span className="p-1 rounded-full bg-amber-50 text-amber-500 font-bold text-xs">!</span>;
      case 'alert':
        return <span className="p-1 rounded-full bg-rose-50 text-rose-500 font-bold text-xs">⚠</span>;
      default:
        return <span className="p-1 rounded-full bg-blue-50 text-blue-500 font-bold text-xs">i</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors">
      {/* Search Input & College Brand / Left Section */}
      <div className="flex items-center flex-1 max-w-xl space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* College Brand Logo Badge */}
        <div className="hidden lg:flex items-center space-x-2.5 mr-2 pr-4 border-r border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            AIT
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 tracking-tight leading-none">
              Adithya Institute of Technology
            </h1>
            <p className="text-[10px] font-medium text-slate-500 tracking-wider">Placement Portal</p>
          </div>
        </div>

        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={`Search students, skills, companies...`}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Right Section Controls */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Role Badge Indicator */}
        <div className="hidden sm:flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100/40">
          <ShieldAlert size={12} className="mr-1.5" />
          {role === 'Placement Faculty' ? 'Placement Officer' : role === 'Faculty' ? 'Placement Faculty' : role} View
        </div>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-40">
              <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No notifications available
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-start space-x-3 hover:bg-slate-50/50 transition-colors ${!item.read ? 'bg-blue-50/5' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-semibold ${!item.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <button
                              onClick={() => markAsRead(item.id)}
                              className="text-slate-300 hover:text-blue-600"
                              title="Mark read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{item.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2.5 p-1 hover:bg-slate-50 rounded-xl transition-colors focus:outline-none cursor-pointer"
          >
            {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <User size={16} />
              </div>
            )}
            <div className="hidden md:block text-left max-w-[120px]">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'User Profile'}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{role}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-40 py-1 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || user?.username}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full px-4 py-2.5 text-xs text-left text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
