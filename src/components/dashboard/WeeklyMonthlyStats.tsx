import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, Building } from 'lucide-react';
import { useOffersStore } from '../../stores/offersStore';
import { useCompaniesStore } from '../../stores/companiesStore';
import { useBeneficiairesStore } from '../../stores/beneficiairesStore';
import { auth } from '../../config/firebase';

export function WeeklyMonthlyStats() {
  const { offers } = useOffersStore();
  const { companies } = useCompaniesStore();
  const { beneficiaires } = useBeneficiairesStore();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Helper function to safely parse dates
  const safeParseDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  // Filtrer les bénéficiaires pour ne compter que ceux de l'utilisateur connecté
  const userBeneficiaires = beneficiaires.filter(b => b.userId === auth.currentUser?.uid);
  
  // Count employed beneficiaries
  const employedBeneficiaires = userBeneficiaires.filter(b => b.employed === true);
  
  // Calculate placement rate (employed beneficiaries / total beneficiaries)
  const placementRate = userBeneficiaires.length > 0 
    ? Math.round((employedBeneficiaires.length / userBeneficiaires.length) * 100)
    : 0;

  // Weekly stats
  const weeklyOffers = offers.filter(o => {
    const offerDate = safeParseDate(o.createdAt);
    return offerDate && offerDate >= weekStart && offerDate <= weekEnd;
  });

  const weeklyFilledOffers = weeklyOffers.filter(o => o.status === 'filled');

  const weeklyStats = {
    offersCollected: weeklyOffers.length,
    offersFilled: weeklyFilledOffers.length,
    newCompanies: companies.filter(c => {
      const contactDate = safeParseDate(c.lastContact);
      return contactDate && contactDate >= weekStart && contactDate <= weekEnd;
    }).length,
    placementRate: placementRate,
    contractTypes: {
      collected: {
        cdi: weeklyOffers.filter(o => o.type === 'CDI').length,
        cdd: weeklyOffers.filter(o => o.type === 'CDD').length,
        interim: weeklyOffers.filter(o => o.type === 'Intérim').length
      },
      filled: {
        cdi: weeklyFilledOffers.filter(o => o.type === 'CDI').length,
        cdd: weeklyFilledOffers.filter(o => o.type === 'CDD').length,
        interim: weeklyFilledOffers.filter(o => o.type === 'Intérim').length
      }
    }
  };

  // Monthly stats
  const monthlyOffers = offers.filter(o => {
    const offerDate = safeParseDate(o.createdAt);
    return offerDate && offerDate >= monthStart && offerDate <= monthEnd;
  });

  const monthlyFilledOffers = monthlyOffers.filter(o => o.status === 'filled');

  const monthlyStats = {
    offersCollected: monthlyOffers.length,
    offersFilled: monthlyFilledOffers.length,
    newCompanies: companies.filter(c => {
      const contactDate = safeParseDate(c.lastContact);
      return contactDate && contactDate >= monthStart && contactDate <= monthEnd;
    }).length,
    placementRate: placementRate,
    contractTypes: {
      collected: {
        cdi: monthlyOffers.filter(o => o.type === 'CDI').length,
        cdd: monthlyOffers.filter(o => o.type === 'CDD').length,
        interim: monthlyOffers.filter(o => o.type === 'Intérim').length
      },
      filled: {
        cdi: monthlyFilledOffers.filter(o => o.type === 'CDI').length,
        cdd: monthlyFilledOffers.filter(o => o.type === 'CDD').length,
        interim: monthlyFilledOffers.filter(o => o.type === 'Intérim').length
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Statistiques hebdomadaires */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Cette semaine
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{weeklyStats.offersCollected}</div>
              <div className="text-xs md:text-sm text-blue-600">Offres collectées</div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-blue-600">CDI: {weeklyStats.contractTypes.collected.cdi}</div>
                <div className="text-xs text-blue-600">CDD: {weeklyStats.contractTypes.collected.cdd}</div>
                <div className="text-xs text-blue-600">Intérim: {weeklyStats.contractTypes.collected.interim}</div>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-green-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-green-600">{weeklyStats.offersFilled}</div>
              <div className="text-xs md:text-sm text-green-600">Offres pourvues</div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-green-600">CDI: {weeklyStats.contractTypes.filled.cdi}</div>
                <div className="text-xs text-green-600">CDD: {weeklyStats.contractTypes.filled.cdd}</div>
                <div className="text-xs text-green-600">Intérim: {weeklyStats.contractTypes.filled.interim}</div>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-purple-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{weeklyStats.newCompanies}</div>
              <div className="text-xs md:text-sm text-purple-600">Nouvelles entreprises</div>
            </div>
            <div className="p-3 md:p-4 bg-orange-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{weeklyStats.placementRate}%</div>
              <div className="text-xs md:text-sm text-orange-600">Taux de placement</div>
              <div className="text-xs text-orange-600">{employedBeneficiaires.length} / {userBeneficiaires.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques mensuelles */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Ce mois ({format(now, 'MMMM yyyy', { locale: fr })})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{monthlyStats.offersCollected}</div>
              <div className="text-xs md:text-sm text-blue-600">Offres collectées</div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-blue-600">CDI: {monthlyStats.contractTypes.collected.cdi}</div>
                <div className="text-xs text-blue-600">CDD: {monthlyStats.contractTypes.collected.cdd}</div>
                <div className="text-xs text-blue-600">Intérim: {monthlyStats.contractTypes.collected.interim}</div>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-green-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-green-600">{monthlyStats.offersFilled}</div>
              <div className="text-xs md:text-sm text-green-600">Offres pourvues</div>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-green-600">CDI: {monthlyStats.contractTypes.filled.cdi}</div>
                <div className="text-xs text-green-600">CDD: {monthlyStats.contractTypes.filled.cdd}</div>
                <div className="text-xs text-green-600">Intérim: {monthlyStats.contractTypes.filled.interim}</div>
              </div>
            </div>
            <div className="p-3 md:p-4 bg-purple-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{monthlyStats.newCompanies}</div>
              <div className="text-xs md:text-sm text-purple-600">Nouvelles entreprises</div>
            </div>
            <div className="p-3 md:p-4 bg-orange-50 rounded-lg">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{monthlyStats.placementRate}%</div>
              <div className="text-xs md:text-sm text-orange-600">Taux de placement</div>
              <div className="text-xs text-orange-600">{employedBeneficiaires.length} / {userBeneficiaires.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}