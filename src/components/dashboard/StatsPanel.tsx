import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Building2, 
  FileCheck, 
  CalendarClock, 
  Send, 
  UserCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { useAgenciesStore } from '../../stores/agenciesStore';
import { useBeneficiairesStore } from '../../stores/beneficiairesStore';
import { useCompaniesStore } from '../../stores/companiesStore';
import { useOffersStore } from '../../stores/offersStore';
import { useEventsStore } from '../../stores/eventsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { useAlertsStore } from '../../stores/alertsStore';
import { auth } from '../../config/firebase';

// Composant pour afficher un tooltip (uniquement en desktop)
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className="relative hidden md:block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Composant pour une carte de statistique avec tooltip en desktop
const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  fullLabel,
  tooltipContent 
}: { 
  icon: React.ElementType, 
  value: number | string, 
  label: string,
  fullLabel: string,
  tooltipContent: string
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20 relative group">
      {/* Version desktop avec tooltip */}
      <Tooltip content={tooltipContent}>
        <div className="hidden md:flex items-center gap-1 md:gap-3 cursor-help">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-xl font-bold text-white truncate">{value}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">{label}</div>
          </div>
        </div>
      </Tooltip>

      {/* Version mobile avec texte complet */}
      <div className="md:hidden flex flex-col">
        <div className="flex items-center gap-1 mb-1">
          <Icon className="w-5 h-5 text-white shrink-0" />
          <div className="text-base font-bold text-white">{value}</div>
        </div>
        <div className="text-xs text-white/80">{fullLabel}</div>
      </div>
    </div>
  );
};

export function StatsPanel() {
  const { agencies } = useAgenciesStore();
  const { beneficiaires } = useBeneficiairesStore();
  const { companies } = useCompaniesStore();
  const { offers } = useOffersStore();
  const { events } = useEventsStore();
  const { appointments } = useAppointmentsStore();
  const { alerts } = useAlertsStore();

  // Filtrer les bénéficiaires pour ne compter que ceux de l'utilisateur connecté
  const userBeneficiaires = beneficiaires.filter(b => b.userId === auth.currentUser?.uid);

  // Count active companies
  const activeCompanies = companies.filter(company => company.status === 'active').length;

  // Count active offers
  const activeOffers = offers.filter(offer => 
    offer.status === 'new' || offer.status === 'open'
  ).length;

  // Count total candidates
  const totalCandidates = offers.reduce((total, offer) => 
    total + (offer.candidates?.length || 0)
  , 0);

  // Count upcoming events
  const upcomingEvents = events.filter(event => event.status === 'upcoming').length;

  // Count CV OK
  const cvOkCount = userBeneficiaires.filter(beneficiaire => beneficiaire.cvOk).length;

  // Count employed beneficiaries
  const employedCount = userBeneficiaires.filter(beneficiaire => beneficiaire.employed === true).length;

  // Calculate placement rate (employed beneficiaries / total beneficiaries)
  const placementRate = userBeneficiaires.length > 0 
    ? Math.round((employedCount / userBeneficiaires.length) * 100)
    : 0;

  // Count appointments by status
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length;
  const lateAppointments = appointments.filter(apt => apt.status === 'late').length;

  // Count alerts by status (rendez-vous type only)
  const pendingAlerts = alerts.filter(alert => 
    alert.type === 'rendez-vous' && alert.status === 'pending'
  ).length;
  
  const lateAlerts = alerts.filter(alert => 
    alert.type === 'rendez-vous' && alert.status === 'late'
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2 md:gap-4 w-full">
      <StatCard 
        icon={Briefcase} 
        value={activeOffers} 
        label="Offres" 
        fullLabel="Offres d'emploi actives"
        tooltipContent="Nombre d'offres d'emploi actives"
      />
      
      <StatCard 
        icon={Users} 
        value={userBeneficiaires.length} 
        label="Bénéficiaires" 
        fullLabel="Total bénéficiaires"
        tooltipContent="Nombre total de bénéficiaires"
      />
      
      <StatCard 
        icon={UserCheck} 
        value={employedCount} 
        label="Emploi" 
        fullLabel="Bénéficiaires en emploi"
        tooltipContent="Bénéficiaires ayant trouvé un emploi"
      />
      
      <StatCard 
        icon={Send} 
        value={totalCandidates} 
        label="Candidatures" 
        fullLabel="Candidatures soumises"
        tooltipContent="Nombre total de candidatures soumises"
      />
      
      <StatCard 
        icon={Building2} 
        value={activeCompanies} 
        label="Entreprises" 
        fullLabel="Entreprises actives"
        tooltipContent="Nombre d'entreprises partenaires actives"
      />
      
      <StatCard 
        icon={CalendarClock} 
        value={upcomingEvents} 
        label="Événements" 
        fullLabel="Événements à venir"
        tooltipContent="Nombre d'événements planifiés"
      />
      
      <StatCard 
        icon={Clock} 
        value={pendingAppointments} 
        label="Attente" 
        fullLabel="RDV en attente"
        tooltipContent="Rendez-vous planifiés en attente"
      />
      
      <StatCard 
        icon={AlertCircle} 
        value={lateAppointments} 
        label="Retard" 
        fullLabel="RDV en retard"
        tooltipContent="Rendez-vous en retard ou manqués"
      />
      
      <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20 relative group">
        {/* Version desktop avec tooltip */}
        <Tooltip content="Pourcentage de bénéficiaires ayant trouvé un emploi">
          <div className="hidden md:flex items-center gap-1 md:gap-3 cursor-help">
            <FileCheck className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-base md:text-xl font-bold text-white truncate">{placementRate}%</div>
              <div className="text-xs md:text-sm text-white/80 truncate">
                Placement
                <span className="text-xs text-white/70 hidden xs:inline ml-1">
                  {employedCount}/{userBeneficiaires.length}
                </span>
              </div>
            </div>
          </div>
        </Tooltip>

        {/* Version mobile avec texte complet */}
        <div className="md:hidden flex flex-col">
          <div className="flex items-center gap-1 mb-1">
            <FileCheck className="w-5 h-5 text-white shrink-0" />
            <div className="text-base font-bold text-white">{placementRate}%</div>
          </div>
          <div className="text-xs text-white/80">
            Taux de placement
            <span className="text-xs text-white/70 ml-1">
              {employedCount}/{userBeneficiaires.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}