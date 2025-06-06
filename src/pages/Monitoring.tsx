import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { BarChart3, TrendingUp, Users, Building2, Calendar, ArrowUp, ArrowDown, Briefcase, UserCheck, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUserStore } from '../stores/userStore';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../stores/themeStore';

interface UserStats {
  userId: string;
  userName: string;
  email: string;
  offersCollected: number;
  offersPlaced: number;
  newCompanies: number;
  eventsCreated: number;
  employedBeneficiaires: number;
  totalBeneficiaires: number;
  placementRate: number;
  monthlyTrend: 'up' | 'down' | 'stable';
}

interface MonthlyStats {
  month: string;
  offersCollected: number;
  offersPlaced: number;
  newCompanies: number;
  eventsCreated: number;
  employedBeneficiaires: number;
  totalBeneficiaires: number;
  employmentRate: number;
}

export default function Monitoring() {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useUserStore();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check user permissions
      const hasAccess = userData && (
        userData.role === 'admin' || 
        userData.role === 'analyst' || 
        userData.role === 'manager' ||
        userData.email === 'slucas@anthea-rh.com' ||
        userData.email === 'vgarau@anthea-rh.com' ||
        userData.id === 'a0yoYjd1EaO2jrZf42ZIo7583cf2' ||
        user.email === 'slucas@anthea-rh.com' ||
        user.email === 'vgarau@anthea-rh.com' ||
        user.uid === 'a0yoYjd1EaO2jrZf42ZIo7583cf2'
      );

      setHasPermission(!!hasAccess);

      if (!hasAccess) {
        setError("Vous n'avez pas les permissions nécessaires pour accéder à cette page.");
        setIsLoading(false);
        return;
      }

      loadStats();
    });

    return () => unsubscribe();
  }, [navigate, userData]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading monitoring stats...");
      
      // Charger tous les utilisateurs (sans filtrer les supprimés)
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Créer une Map pour stocker les utilisateurs uniques par email
      const usersMap = new Map();
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        
        // Ne pas inclure les utilisateurs supprimés
        if (userData.deleted === true) {
          return;
        }
        
        // Utiliser l'email comme clé unique pour éviter les doublons
        if (userData.email && !usersMap.has(userData.email)) {
          if (userData.email === 'slucas@anthea-rh.com' || userData.email === 'vgarau@anthea-rh.com' || userData.id === 'a0yoYjd1EaO2jrZf42ZIo7583cf2') {
            usersMap.set(userData.email, {
              id: doc.id,
              ...userData,
              role: 'admin',
              lastLogin: userData.lastLogin?.toDate(),
              createdAt: userData.createdAt?.toDate(),
              deletedAt: userData.deletedAt?.toDate(),
              initialPassword: userData.initialPassword,
              firebaseUid: userData.uid,
              loginHistory: userData.loginHistory?.map((login: any) => ({
                date: login.date.toDate(),
                count: login.count
              })) || []
            });
          } else {
            usersMap.set(userData.email, {
              id: doc.id,
              ...userData,
              lastLogin: userData.lastLogin?.toDate(),
              createdAt: userData.createdAt?.toDate(),
              deletedAt: userData.deletedAt?.toDate(),
              initialPassword: userData.initialPassword,
              firebaseUid: userData.uid,
              loginHistory: userData.loginHistory?.map((login: any) => ({
                date: login.date.toDate(),
                count: login.count
              })) || []
            });
          }
        }
      });
      
      const users = Array.from(usersMap.values());
      console.log(`Loaded ${users.length} unique users`);

      // Charger les offres
      const offersSnapshot = await getDocs(collection(db, 'offers'));
      const offers = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Charger les entreprises
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companies = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Charger les événements
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Charger les bénéficiaires
      const beneficiairesSnapshot = await getDocs(collection(db, 'beneficiaires'));
      const beneficiaires = beneficiairesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculer les statistiques par utilisateur
      const stats = users.map(user => {
        const userOffers = offers.filter(o => o.userId === user.id);
        const userCompanies = companies.filter(c => c.userId === user.id);
        const userEvents = events.filter(e => e.userId === user.id);
        const userBeneficiaires = beneficiaires.filter(b => b.userId === user.id);
        const employedBeneficiaires = userBeneficiaires.filter(b => b.employed === true);

        const offersCollected = userOffers.length;
        const offersPlaced = userOffers.filter(o => o.status === 'filled').length;
        
        // Calcul du taux de placement basé sur les bénéficiaires en emploi
        const placementRate = userBeneficiaires.length > 0 
          ? Math.round((employedBeneficiaires.length / userBeneficiaires.length) * 100) 
          : 0;

        return {
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Utilisateur sans nom',
          email: user.email || '',
          offersCollected,
          offersPlaced,
          newCompanies: userCompanies.length,
          eventsCreated: userEvents.length,
          employedBeneficiaires: employedBeneficiaires.length,
          totalBeneficiaires: userBeneficiaires.length,
          placementRate,
          monthlyTrend: 'stable' as const
        };
      });

      // Calculer les statistiques mensuelles
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthlyEmployedBeneficiaires = beneficiaires.filter(b => b.employed === true).length;
      const monthlyTotalBeneficiaires = beneficiaires.length;
      const employmentRate = monthlyTotalBeneficiaires > 0
        ? Math.round((monthlyEmployedBeneficiaires / monthlyTotalBeneficiaires) * 100)
        : 0;

      const monthlyStats: MonthlyStats = {
        month: format(now, 'MMMM yyyy', { locale: fr }),
        offersCollected: offers.filter(o => {
          const offerDate = new Date(o.createdAt);
          return offerDate >= monthStart && offerDate <= monthEnd;
        }).length,
        offersPlaced: offers.filter(o => {
          const offerDate = new Date(o.createdAt);
          return offerDate >= monthStart && offerDate <= monthEnd && o.status === 'filled';
        }).length,
        newCompanies: companies.filter(c => {
          const date = new Date(c.createdAt);
          return date >= monthStart && date <= monthEnd;
        }).length,
        eventsCreated: events.filter(e => {
          const date = new Date(e.createdAt);
          return date >= monthStart && date <= monthEnd;
        }).length,
        employedBeneficiaires: monthlyEmployedBeneficiaires,
        totalBeneficiaires: monthlyTotalBeneficiaires,
        employmentRate: employmentRate
      };

      setUserStats(stats);
      setMonthlyStats([monthlyStats]);
      setIsLoading(false);
      console.log("Monitoring stats loaded successfully");
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
      setError('Erreur lors du chargement des statistiques');
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const userStatsData = userStats.map(stat => ({
        'Utilisateur': stat.userName,
        'Email': stat.email,
        'Offres collectées': stat.offersCollected,
        'Offres pourvues': stat.offersPlaced,
        'Nouvelles entreprises': stat.newCompanies,
        'Événements créés': stat.eventsCreated,
        'Bénéficiaires en emploi': `${stat.employedBeneficiaires} / ${stat.totalBeneficiaires}`,
        'Taux de placement': `${stat.placementRate}%`
      }));

      const monthlyStatsData = monthlyStats.map(stat => ({
        'Mois': stat.month,
        'Offres collectées': stat.offersCollected,
        'Offres pourvues': stat.offersPlaced,
        'Nouvelles entreprises': stat.newCompanies,
        'Événements créés': stat.eventsCreated,
        'Bénéficiaires en emploi': `${stat.employedBeneficiaires} / ${stat.totalBeneficiaires}`,
        'Taux d\'emploi': `${stat.employmentRate}%`
      }));

      // Créer un nouveau classeur Excel
      const wb = XLSX.utils.book_new();

      // Ajouter la feuille des statistiques par utilisateur
      const wsUsers = XLSX.utils.json_to_sheet(userStatsData);
      XLSX.utils.book_append_sheet(wb, wsUsers, 'Statistiques par utilisateur');

      // Ajouter la feuille des statistiques mensuelles
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyStatsData);
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Statistiques mensuelles');

      // Générer le nom du fichier avec la date actuelle
      const fileName = `monitoring_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(wb, fileName);
      
      toast.success('Export Excel réussi !');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const toggleUserExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className={`${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'} rounded-xl p-6 text-center max-w-lg`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'} mb-2`}>Accès refusé</h2>
          <p className={darkMode ? 'text-red-300' : 'text-red-600'}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
            Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-anthea-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-xl`}>
        <p className={darkMode ? 'text-red-300' : 'text-red-600'}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Monitoring</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleExportToExcel}
            className={`hidden md:flex items-center px-4 py-2 ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} transition-colors`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter en Excel
          </button>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            Dernière mise à jour : {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-gradient-anthea text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques globales du mois */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="w-5 h-5 mr-2 text-anthea-blue" />
            Vue d'ensemble - {monthlyStats[0]?.month}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-xl p-3 md:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Offres collectées</p>
                  <p className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{monthlyStats[0]?.offersCollected}</p>
                </div>
                <Briefcase className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
              </div>
            </div>
            <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-xl p-3 md:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Offres pourvues</p>
                  <p className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{monthlyStats[0]?.offersPlaced}</p>
                </div>
                <TrendingUp className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-green-400' : 'text-green-400'}`} />
              </div>
            </div>
            <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} rounded-xl p-3 md:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Nouvelles entreprises</p>
                  <p className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{monthlyStats[0]?.newCompanies}</p>
                </div>
                <Building2 className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-purple-400' : 'text-purple-400'}`} />
              </div>
            </div>
            <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} rounded-xl p-3 md:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Événements créés</p>
                  <p className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>{monthlyStats[0]?.eventsCreated}</p>
                </div>
                <Calendar className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-orange-400' : 'text-orange-400'}`} />
              </div>
            </div>
            <div className="col-span-2 md:col-span-1 bg-teal-50 rounded-xl p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>Taux d'emploi</p>
                  <p className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{monthlyStats[0]?.employmentRate}%</p>
                  <p className={`text-xs ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>{monthlyStats[0]?.employedBeneficiaires} / {monthlyStats[0]?.totalBeneficiaires}</p>
                </div>
                <UserCheck className={`w-6 h-6 md:w-8 md:h-8 ${darkMode ? 'text-teal-400' : 'text-teal-400'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques par utilisateur - Version desktop */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden hidden md:block`}>
        <div className="p-6">
          <h2 className={`text-lg font-semibold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 mr-2 text-anthea-blue" />
            Performance par utilisateur
          </h2>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Utilisateur
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Email
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Offres collectées
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Offres pourvues
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Nouvelles entreprises
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Événements créés
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Bénéficiaires en emploi
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Taux de placement
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Tendance
                  </th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {userStats.map((stat) => (
                  <tr key={stat.userId}>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm font-medium">{stat.userName}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="text-sm">{stat.email}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">{stat.offersCollected}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">{stat.offersPlaced}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">{stat.newCompanies}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">{stat.eventsCreated}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">
                        {stat.employedBeneficiaires} / {stat.totalBeneficiaires}
                        <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({stat.totalBeneficiaires > 0 
                            ? Math.round((stat.employedBeneficiaires / stat.totalBeneficiaires) * 100) 
                            : 0}%)
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="text-sm">{stat.placementRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stat.monthlyTrend === 'up' ? (
                        <ArrowUp className="w-5 h-5 text-green-600" />
                      ) : stat.monthlyTrend === 'down' ? (
                        <ArrowDown className="w-5 h-5 text-red-600" />
                      ) : (
                        <div className="w-5 h-0.5 bg-gray-300 rounded-full" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Statistiques par utilisateur - Version mobile */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm overflow-hidden md:hidden`}>
        <div className="p-4">
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 mr-2 text-anthea-blue" />
            Performance par utilisateur
          </h2>
          
          <div className="space-y-4">
            {userStats.map((stat) => (
              <div key={stat.userId} className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
                <div 
                  className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer`}
                  onClick={() => toggleUserExpand(stat.userId)}
                >
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.userName}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{stat.email}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 text-sm font-medium">
                      <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stat.placementRate}%</span>
                    </div>
                    {expandedUser === stat.userId ? (
                      <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`} />
                    )}
                  </div>
                </div>
                
                {expandedUser === stat.userId && (
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Offres collectées</p>
                            <p className={`text-lg font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{stat.offersCollected}</p>
                          </div>
                          <Briefcase className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
                        </div>
                      </div>
                      <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg p-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Offres pourvues</p>
                            <p className={`text-lg font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{stat.offersPlaced}</p>
                          </div>
                          <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-400'}`} />
                        </div>
                      </div>
                      <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Entreprises</p>
                            <p className={`text-lg font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{stat.newCompanies}</p>
                          </div>
                          <Building2 className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-400'}`} />
                        </div>
                      </div>
                      <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} rounded-lg p-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Événements</p>
                            <p className={`text-lg font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>{stat.eventsCreated}</p>
                          </div>
                          <Calendar className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-400'}`} />
                        </div>
                      </div>
                    </div>
                    
                    <div className={`mt-3 ${darkMode ? 'bg-teal-900' : 'bg-teal-50'} rounded-lg p-2`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}>Bénéficiaires en emploi</p>
                          <p className={`text-lg font-bold ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                            {stat.employedBeneficiaires} / {stat.totalBeneficiaires}
                            <span className="ml-2 text-xs font-normal">
                              ({stat.placementRate}%)
                            </span>
                          </p>
                        </div>
                        <UserCheck className={`w-5 h-5 ${darkMode ? 'text-teal-400' : 'text-teal-400'}`} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}