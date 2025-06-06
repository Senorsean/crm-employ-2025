import React, { useState, useEffect } from 'react';
import { Share2, UserCircle, Settings } from 'lucide-react';
import { auth } from '../config/firebase';
import { StatsPanel } from '../components/dashboard/StatsPanel';
import { WeeklyMonthlyStats } from '../components/dashboard/WeeklyMonthlyStats';
import { DashboardNotes } from '../components/dashboard/DashboardNotes';
import ShareStatsModal from '../components/ShareStatsModal';
import ProfileModal from '../components/ProfileModal';
import { useNavigate } from 'react-router-dom';
import { useOffersStore } from '../stores/offersStore';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { useCompaniesStore } from '../stores/companiesStore';
import { useEventsStore } from '../stores/eventsStore';
import { checkAdminStatus } from '../utils/checkAdminStatus';
import { useThemeStore } from '../stores/themeStore';

function Dashboard() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { darkMode } = useThemeStore();

  // Récupérer les fonctions de chargement des données
  const { loadOffers } = useOffersStore();
  const { loadBeneficiaires } = useBeneficiairesStore();
  const { loadCompanies } = useCompaniesStore();
  const { loadEvents } = useEventsStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Vérifier le statut admin
      if (user.email === 'slucas@anthea-rh.com') {
        const isUserAdmin = await checkAdminStatus(user.email);
        setIsAdmin(isUserAdmin);
        console.log('Statut admin:', isUserAdmin);
      }
      
      // Charger toutes les données nécessaires
      Promise.all([
        loadOffers(),
        loadBeneficiaires(),
        loadCompanies(),
        loadEvents()
      ]).catch(error => {
        console.error('Error loading dashboard data:', error);
      });
    });

    return () => unsubscribe();
  }, [navigate, loadOffers, loadBeneficiaires, loadCompanies, loadEvents]);

  // Récupérer le prénom de l'utilisateur
  const getFirstName = () => {
    if (!user?.displayName) return '';
    return user.displayName.split(' ')[0];
  };

  return (
    <div className="space-y-8">
      <div className="relative bg-gradient-anthea rounded-2xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Équipe au travail"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20 object-[center_25%]"
        />
        <div className="relative p-8">
          {/* En-tête avec profil */}
          <div className="flex justify-end mb-4 md:mb-8">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h1 className="text-xl font-semibold text-white">
                  Bienvenue, {getFirstName()} !
                </h1>
                <p className="text-sm text-white/80">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(true)}
                className="relative group"
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white transition-opacity group-hover:opacity-80">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </button>
            </div>
          </div>

          {/* Statistiques et bouton de partage */}
          <div className="flex justify-between items-start">
            <StatsPanel />
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors border border-white/20"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WeeklyMonthlyStats />
        </div>
        <div className="lg:col-span-1">
          <DashboardNotes />
        </div>
      </div>

      {showShareModal && (
        <ShareStatsModal onClose={() => setShowShareModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default Dashboard;