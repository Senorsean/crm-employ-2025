import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import FollowUpScheduler from '../components/FollowUpScheduler';

interface Appointment {
  id: number;
  title: string;
  time: string;
  agency: string;
  contact: string;
  date: Date;
}

function Rendezvous() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const appointments: Appointment[] = [
    {
      id: 1,
      title: 'Entretien avec Monsieur Dupont',
      time: '10:00',
      agency: 'Agence Paris',
      contact: 'dupont@example.com',
      date: new Date(2025, 5, 7),
    },
    {
      id: 2,
      title: 'Suivi de candidature',
      time: '14:00',
      agency: 'Agence Lyon',
      contact: 'contact@lyon.fr',
      date: new Date(2025, 5, 7),
    },
    {
      id: 3,
      title: 'Réunion client',
      time: '09:00',
      agency: 'Agence Marseille',
      contact: 'marseille@agence.fr',
      date: new Date(2025, 5, 8),
    },
  ];

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(
      (apt) =>
        apt.date.getFullYear() === date.getFullYear() &&
        apt.date.getMonth() === date.getMonth() &&
        apt.date.getDate() === date.getDate()
    );
  };

  const handleFollowUp = (appointment: Appointment) => {
    setSelectedCompany(appointment.title);
    setShowFollowUp(true);
  };

  const handleScheduleAction = (step: any) => {
    console.log('Action planifiée:', step);
  };

  return (
    <div>
      {selectedDate && (
        <div className="mt-8 space-y-8">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Rendez-vous du {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
              </h2>
              <div className="space-y-4">
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{apt.title}</p>
                      <p className="text-sm text-gray-500">{apt.time}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{apt.agency}</p>
                        <p className="text-sm text-gray-500">{apt.contact}</p>
                      </div>
                      <button
                        onClick={() => handleFollowUp(apt)}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        Planifier le suivi
                      </button>
                    </div>
                  </div>
                ))}
                {getAppointmentsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500">Aucun rendez-vous prévu pour cette date</p>
                )}
              </div>
            </div>
          </div>

          {showFollowUp && selectedCompany && (
            <FollowUpScheduler
              initialContactDate={selectedDate}
              onScheduleAction={handleScheduleAction}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Rendezvous;
