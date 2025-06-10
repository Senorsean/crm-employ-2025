import React from 'react';
import { Briefcase, Users, Building2, FileCheck, CalendarClock, Send, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { useAgenciesStore } from '../../stores/agenciesStore';
import { useBeneficiairesStore } from '../../stores/beneficiairesStore';
import { useCompaniesStore } from '../../stores/companiesStore';
import { useOffersStore } from '../../stores/offersStore';
import { useEventsStore } from '../../stores/eventsStore';
import { useAppointmentsStore } from '../../stores/appointmentsStore';
import { useAlertsStore } from '../../stores/alertsStore';
import { auth } from '../../config/firebase';

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
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <Briefcase className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{activeOffers}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Offres actives</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <Users className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{userBeneficiaires.length}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Bénéficiaires</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <UserCheck className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{employedCount}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">En emploi</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <Send className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{totalCandidates}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Candidatures</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <Building2 className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{activeCompanies}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Entreprises actives</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <CalendarClock className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{upcomingEvents}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Événements à venir</div>
          </div>
        </div>
      </div>
      
      {/* Nouveaux compteurs pour les rendez-vous */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <Clock className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{pendingAppointments}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">RDV en attente</div>
          </div>
        </div>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <AlertCircle className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{lateAppointments}</div>
            <div className="text-xs md:text-sm text-white/80 truncate">RDV en retard</div>
          </div>
        </div>
      </div>
      
      {/* Placement rate card takes full width on mobile (2 columns) */}
      <div className="col-span-2 sm:col-span-1 md:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-2 md:p-4 border border-white/20">
        <div className="flex items-center gap-1 md:gap-3">
          <FileCheck className="w-5 h-5 md:w-8 md:h-8 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-2xl font-bold text-white truncate">{placementRate}%</div>
            <div className="text-xs md:text-sm text-white/80 truncate">Taux de placement</div>
            <div className="text-xs text-white/70 hidden xs:block">
              {employedCount}/{userBeneficiaires.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}