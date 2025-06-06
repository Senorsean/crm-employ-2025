import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Briefcase, 
  Building2, 
  Building, 
  Mail, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  FileText,
  CalendarClock,
  Settings,
  Shield,
  BarChart3,
  UserCircle
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useUserStore } from '../stores/userStore';
import { useThemeStore } from '../stores/themeStore';
import { toast } from 'react-hot-toast';
import Footer from './Footer';
import ProfileModal from './ProfileModal';
import ThemeToggle from './ThemeToggle';

function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const { userData, isAdmin } = useUserStore();
  const { darkMode } = useThemeStore();
  const [menuItems, setMenuItems] = useState<Array<{icon: any, label: string, path: string}>>([]);

  useEffect(() => {
    // Base menu items that everyone can see
    const baseMenuItems = [
      { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
      { icon: Calendar, label: 'Rendez-vous', path: '/rendez-vous' },
      { icon: Users, label: 'Bénéficiaires', path: '/beneficiaires' },
      { icon: Building, label: 'Entreprises', path: '/entreprises' },
      { icon: Briefcase, label: 'Offres d\'emploi', path: '/offres' },
      { icon: CalendarClock, label: 'Événements', path: '/evenements' },
      { icon: Building2, label: 'Agences', path: '/agences' },
      { icon: FileText, label: 'Documents', path: '/documents' },
      { icon: Mail, label: 'Newsletter', path: '/newsletter' },
    ];

    const items = [...baseMenuItems];

    // Add Monitoring for admin, analyst roles, managers, and specific emails
    if (userData?.role === 'admin' || 
        userData?.role === 'analyst' || 
        userData?.role === 'manager' ||
        userData?.email === 'slucas@anthea-rh.com' || 
        userData?.email === 'vgarau@anthea-rh.com' ||
        userData?.id === 'a0yoYjd1EaO2jrZf42ZIo7583cf2') {
      items.push({ icon: BarChart3, label: 'Monitoring', path: '/monitoring' });
    }

    // Add User Management only for admin and slucas@anthea-rh.com
    if (isAdmin || userData?.role === 'admin' || userData?.email === 'slucas@anthea-rh.com') {
      items.push({ icon: Shield, label: 'Gestion des utilisateurs', path: '/utilisateurs' });
    }
    
    // Add Security page for all users
    items.push({ icon: Shield, label: 'Sécurité', path: '/securite' });

    setMenuItems(items);
  }, [userData, isAdmin]);

  useEffect(() => {
    // Apply dark mode to the document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm z-50 flex items-center justify-between px-4`}>
        <div className="flex items-center flex-grow justify-start">
          {darkMode ? (
            <img 
              src="/logo-anthea-blanc.png"
              alt="Anthea RH" 
              className="h-8"
              style={{ width: '100px', height: 'auto' }}
            />
          ) : (
            <img 
              src="/logo-anthea-color.png"
              alt="Anthea RH" 
              className="h-10"
              style={{ width: '150px', height: 'auto' }}
            />
          )}
          <span className="text-lg font-bold text-anthea-lime ml-2" style={{ maxWidth: '100px' }}>CRM Emploi</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-40" onClick={closeMobileMenu} />
      )}

      {/* Sidebar - Desktop and Mobile */}
      <nav className={`fixed top-0 left-0 h-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg transition-all duration-300 z-50
        lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Desktop Logo */}
        <div className={`hidden lg:flex flex-col p-6 border-b ${darkMode ? 'border-gray-700' : 'border-anthea-lime'} ${isCollapsed ? 'items-center justify-center' : 'items-center'}`}>
          {!isCollapsed ? (
            // Logo normal - menu déplié
            <>
              {darkMode ? (
                // Mode nuit - logo blanc complet
                <img 
                  src="/logo-anthea-blanc.png"
                  alt="Anthea RH" 
                  className="h-8 w-auto mb-2"
                  style={{ width: '150px', height: 'auto' }}
                />
              ) : (
                // Mode jour - logo couleur complet
                <img 
                  src="/logo-anthea-color.png"
                  alt="Anthea RH" 
                  className="h-12 w-auto mb-2"
                  style={{ width: '5000px', height: 'auto' }}
                />
              )}
              <h2 className="text-xl font-bold text-anthea-lime">CRM Emploi</h2>
            </>
          ) : (
            // Logo rétréci - menu replié - SUPPRIMÉ
            <div className="flex items-center justify-center">
              {/* Espace vide où était le logo */}
            </div>
          )}
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center p-4 border-b border-gray-200">
          <div className="flex items-center flex-grow justify-start">
            {darkMode ? (
              <img 
                src="/logo-anthea-blanc.png"
                alt="Anthea RH" 
                className="h-8"
                style={{ width: '100px', height: 'auto' }}
              />
            ) : (
              <img 
                src="/logo-anthea-color.png"
                alt="Anthea RH" 
                className="h-10"
                style={{ width: '120px', height: 'auto' }}
              />
            )}
            <span className="text-lg font-bold text-anthea-lime ml-2">CRM Emploi</span>
          </div>
        </div>

        {/* Collapse Button - Desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:block absolute -right-3 top-24 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-full p-1 shadow-md hover:${darkMode ? 'bg-gray-600' : 'bg-gray-50'}`}
        >
          {isCollapsed ? 
            <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} /> : 
            <ChevronLeft className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          }
        </button>

        {/* Menu Items */}
        <div className="mt-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gradient-anthea hover:text-white'} transition-all ${
                  isActive ? (darkMode ? 'bg-gray-700 text-white' : 'bg-gradient-anthea text-white border-l-4 border-anthea-lime') : ''
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 min-w-5" />
              {(!isCollapsed || isMobileMenuOpen) && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Theme Toggle and Logout Button */}
        <div className={`absolute bottom-0 w-full p-6 border-t ${darkMode ? 'border-gray-700' : 'border-anthea-lime'}`}>
          {(!isCollapsed || isMobileMenuOpen) && (
            <div className="mb-4">
              <ThemeToggle />
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-2 ${
              darkMode 
                ? 'text-gray-300 hover:bg-red-900 hover:text-red-200' 
                : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
            } rounded-2xl transition-colors`}
            title={isCollapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="w-5 h-5 min-w-5" />
            {(!isCollapsed || isMobileMenuOpen) && <span className="ml-3">Déconnexion</span>}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`transition-all duration-300 
        ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} 
        ${isMobileMenuOpen ? 'ml-64' : 'ml-0'}
        pt-20 lg:pt-8 px-4 lg:px-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
      >
        <Outlet />
        <Footer />
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default Layout;