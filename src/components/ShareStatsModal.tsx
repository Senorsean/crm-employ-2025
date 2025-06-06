import React from 'react';
import { X, Share2, TrendingUp, Building, Mail } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useOffersStore } from '../stores/offersStore';
import { useCompaniesStore } from '../stores/companiesStore';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { auth } from '../config/firebase';

interface ShareStatsModalProps {
  onClose: () => void;
}

function ShareStatsModal({ onClose }: ShareStatsModalProps) {
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

  const handleShare = () => {
    const statsText = `
Statistiques Anthea RH

📊 Cette semaine :
- ${weeklyStats.offersCollected} offres collectées
  • CDI : ${weeklyStats.contractTypes.collected.cdi}
  • CDD : ${weeklyStats.contractTypes.collected.cdd}
  • Intérim : ${weeklyStats.contractTypes.collected.interim}
- ${weeklyStats.offersFilled} offres pourvues
  • CDI : ${weeklyStats.contractTypes.filled.cdi}
  • CDD : ${weeklyStats.contractTypes.filled.cdd}
  • Intérim : ${weeklyStats.contractTypes.filled.interim}
- ${weeklyStats.newCompanies} nouvelles entreprises
- ${weeklyStats.placementRate}% taux de placement (${employedBeneficiaires.length}/${userBeneficiaires.length} bénéficiaires en emploi)

📈 ${format(now, 'MMMM yyyy', { locale: fr })} :
- ${monthlyStats.offersCollected} offres collectées
  • CDI : ${monthlyStats.contractTypes.collected.cdi}
  • CDD : ${monthlyStats.contractTypes.collected.cdd}
  • Intérim : ${monthlyStats.contractTypes.collected.interim}
- ${monthlyStats.offersFilled} offres pourvues
  • CDI : ${monthlyStats.contractTypes.filled.cdi}
  • CDD : ${monthlyStats.contractTypes.filled.cdd}
  • Intérim : ${monthlyStats.contractTypes.filled.interim}
- ${monthlyStats.newCompanies} nouvelles entreprises
- ${monthlyStats.placementRate}% taux de placement (${employedBeneficiaires.length}/${userBeneficiaires.length} bénéficiaires en emploi)
    `.trim();

    const subject = `Statistiques Anthea RH - ${format(now, 'd MMMM yyyy', { locale: fr })}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(statsText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Share2 className="w-5 h-5 mr-2 text-blue-600" />
              Partager les statistiques
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Statistiques hebdomadaires */}
            <div>
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

            {/* Statistiques mensuelles */}
            <div>
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

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Fermer
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Envoyer par email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareStatsModal;