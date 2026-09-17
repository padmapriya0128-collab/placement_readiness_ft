import React, { useState, useEffect } from 'react';
import { AppNotification } from './types';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Chatbot from './components/Chatbot';
import FacultyDashboard from './pages/FacultyDashboard';
import PlacementFacultyDashboard from './pages/PlacementFacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ProfilePage from './pages/ProfilePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { getStudentProfileByRegisterNumber } from './api/students';

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentRole, setCurrentRole] = useState<'Faculty' | 'Placement Faculty' | 'Student' | null>(null);

  // App global layouts & Routing
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');

  // Explicit route tracking for Privacy Policy & Terms of Service
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname.toLowerCase());

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.toLowerCase());
  };

  // App Notifications log (start completely empty according to strict requirements)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load persistent session from local storage if available
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    const cachedRole = localStorage.getItem('auth_role');

    if (cachedUser && cachedRole) {
      setCurrentUser(JSON.parse(cachedUser));
      setCurrentRole(cachedRole as any);

      // Select appropriate initial tab based on role
      if (cachedRole === 'Faculty') setActiveTab('students');
      else if (cachedRole === 'Placement Faculty') setActiveTab('company-requirements');
      else setActiveTab('student-dashboard');
    }
  }, []);

  // Ensure student profile is always updated with exact database record using Register Number
  useEffect(() => {
    if (currentRole === 'Student' && currentUser?.registerNumber) {
      getStudentProfileByRegisterNumber(currentUser.registerNumber).then(profile => {
        if (profile && profile.registerNumber) {
          setCurrentUser(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(profile)) {
              localStorage.setItem('auth_user', JSON.stringify(profile));
              return profile;
            }
            return prev;
          });
        }
      });
    }
  }, [currentRole, currentUser?.registerNumber]);

  const handleLoginSuccess = (user: any, role: 'Faculty' | 'Placement Faculty' | 'Student') => {
    setCurrentUser(user);
    setCurrentRole(role);

    // Select appropriate default active tab
    if (role === 'Faculty') setActiveTab('students');
    else if (role === 'Placement Faculty') setActiveTab('company-requirements');
    else setActiveTab('students');

    addNotification(
      'Logged in Successfully',
      `Welcome back, ${user.name}! Authorized as ${role === 'Placement Faculty' ? 'Placement Officer' : role === 'Faculty' ? 'Placement Faculty' : role}.`,
      'success'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const addNotification = (
    title: string,
    description: string,
    type: 'info' | 'success' | 'warning' | 'alert'
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      description,
      timestamp: '1m ago',
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Standalone / Direct Route Rendering for Privacy Policy & Terms of Service
  const isPrivacyRoute = currentPath === '/privacy' || currentPath === '/privacy-policy' || activeTab === 'privacy';
  const isTermsRoute = currentPath === '/terms' || currentPath === '/terms-of-service' || activeTab === 'terms';

  if (isPrivacyRoute) {
    return (
      <PrivacyPolicy
        onBack={() => {
          setActiveTab('students');
          navigateTo('/');
        }}
        onNavigateToTerms={() => {
          setActiveTab('terms');
          navigateTo('/terms');
        }}
      />
    );
  }

  if (isTermsRoute) {
    return (
      <TermsOfService
        onBack={() => {
          setActiveTab('students');
          navigateTo('/');
        }}
        onNavigateToPrivacy={() => {
          setActiveTab('privacy');
          navigateTo('/privacy');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors duration-200">

      {/* Main Core Router View */}
      {!currentUser || !currentRole ? (
        // Login Component (renders fully customized auth pages)
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateToPrivacy={() => navigateTo('/privacy')}
          onNavigateToTerms={() => navigateTo('/terms')}
        />
      ) : (
        // Authenticated Dashboard Layout
        <div className="flex flex-1 relative">

          {/* Mobile Sidebar backdrop overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-all duration-300 animate-fade-in"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Main collapsible sidebar */}
          <Sidebar
            role={currentRole}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'privacy') navigateTo('/privacy');
              else if (tab === 'terms') navigateTo('/terms');
              else setActiveTab(tab);
            }}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onLogout={handleLogout}
          />

          {/* Core content wrapper */}
          <div className="flex-1 min-h-screen bg-slate-50 flex flex-col overflow-hidden transition-colors">

            {/* Contextual header bar (search, notifications, profile dropdown) */}
            <Header
              user={currentUser}
              role={currentRole}
              onLogout={handleLogout}
              onSearch={setSearchTerm}
              notifications={notifications}
              setNotifications={setNotifications}
              onToggleSidebar={() => setIsOpen(!isOpen)}
            />

            {/* Main content viewport */}
            <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
              {activeTab === 'profile' ? (
                <ProfilePage
                  user={currentUser}
                  role={currentRole}
                  onUpdateUser={(updated) => {
                    setCurrentUser(updated);
                    localStorage.setItem('auth_user', JSON.stringify(updated));
                  }}
                />
              ) : (
                <>
                  {currentRole === 'Faculty' && (
                    <FacultyDashboard
                      user={currentUser}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      searchTerm={searchTerm}
                      onAddNotification={addNotification}
                    />
                  )}

                  {currentRole === 'Placement Faculty' && (
                    <PlacementFacultyDashboard
                      user={currentUser}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      searchTerm={searchTerm}
                      onAddNotification={addNotification}
                      notifications={notifications}
                      onUpdateAvatar={(url) => {
                        const updated = { ...currentUser, avatarUrl: url };
                        setCurrentUser(updated);
                        localStorage.setItem('auth_user', JSON.stringify(updated));
                      }}
                    />
                  )}

                  {currentRole === 'Student' && (
                    <StudentDashboard
                      user={currentUser}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      onAddNotification={addNotification}
                      notifications={notifications}
                    />
                  )}
                </>
              )}
            </main>
          </div>

          {/* AI Floating Chatbot Component */}
          <Chatbot role={currentRole} />

        </div>
      )}
    </div>
  );
}
