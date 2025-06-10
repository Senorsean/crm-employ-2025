import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Bell, Calendar, MapPin, Clock, Building2, User } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import AppointmentForm from '../components/AppointmentForm';
import CalendarView from '../components/CalendarView';
import { useThemeStore } from '../stores/themeStore';
import { toast } from 'react-hot-toast';
import { auth } from '../config/firebase';

interface Appointment {
  id: string;
  title: string;
  date: Date;
  time: string;
  agency: string;
  contact: string;
  priority: 'high' | 'medium' | 'normal';
  status?: 'pending' | 'completed' | 'late';
  alert?: {
    enabled: boolean;
    time: string;
    type: 'email' | 'notification' | 'both';
  };
}

interface Alert {
  id: string;
  type: 'relance' | 'rendez-vous';
  company: string;
  date: Date;
  agency: string;
  status: 'pending' | 'completed' | 'skipped' | 'late';
  step: number;
  description?: string;
  action?: string;
}

function RendezVous() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { darkMode } = useThemeStore();

  // Load appointments and alerts (mock data for now)
  useEffect(() => {
    // Mock appointments data
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        title: 'Entretien avec Tech Solutions',
        date: new Date(2025, 5, 7),
        time: '10:00',
        agency: 'Marseille 4',
        contact: 'Marie Dupont',
        priority: 'high',
        status: 'pending',
        alert: {
          enabled: true,
          time: '15',
          type: 'email'
        }
      },
      {
        id: '2',
        title: 'Suivi de candidature Logistique Express',
        date: new Date(2025, 5, 7),
        time: '14:00',
        agency: 'Marseille 16',
        contact: 'Jean Martin',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Réunion client Santé Plus',
        date: new Date(2025, 5, 8),
        time: '09:00',
        agency: 'Vitrolles',
        contact: 'Sophie Bernard',
        priority: 'normal',
        status: 'pending'
      },
      {
        id: '4',
        title: 'Présentation Anthea RH',
        date: new Date(2025, 5, 6),
        time: '11:30',
        agency: 'Marseille 4',
        contact: 'Thomas Petit',
        priority: 'high',
        status: 'completed'
      }
    ];

    // Mock alerts data
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'relance',
        company: 'Tech Solutions',
        date: new Date(2025, 5, 10),
        agency: 'Marseille 4',
        status: 'pending',
        step: 1,
        description: 'Premier suivi après la présentation des services Anthea',
        action: 'Appeler le responsable RH'
      },
      {
        id: '2',
        type: 'relance',
        company: 'Logistique Express',
        date: new Date(2025, 5, 14),
        agency: 'Marseille 16',
        status: 'pending',
        step: 2,
        description: 'Envoi de la newsletter avec les profils disponibles'
      }
    ];

    setAppointments(mockAppointments);
    setAlerts(mockAlerts);
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddAppointment = (data: any) => {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      title: data.title,
      date: new Date(`${data.date}T${data.time}`),
      time: data.time,
      agency: data.agency,
      contact: data.contact,
      priority: data.priority,
      status: 'pending',
      alert: data.enableAlert ? {
        enabled: true,
        time: data.alertTime,
        type: data.alertType
      } : undefined
    };

    setAppointments([...appointments, newAppointment]);
    setShowAppointmentForm(false);
    toast.success('Rendez-vous créé avec succès');
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(
      (apt) => isSameDay(apt.date, date)
    );
  };

  const getAlertsForCalendar = () => {
    return appointments.map(apt => ({
      date: apt.date,
      status: apt.status || 'pending'
    }));
  };

  const handleUpdateStatus = (alertId: string, status: Alert['status']) => {
    setAlerts(
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
    toast.success(`Alerte mise à jour avec succès`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rendez-vous</h1>
        <button
          onClick={() => setShowAppointmentForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau rendez-vous
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full`}
                >
                  <ChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-full`}
                >
                  <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>

            <CalendarView 
              currentDate={currentMonth}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              alerts={getAlertsForCalendar()}
            />
          </div>

          {selectedDate && (
            <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
              <div className="p-6">
                <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rendez-vous du {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
                </h2>
                <div className="space-y-4">
                  {getAppointmentsForDate(selectedDate).map((apt) => (
                    <div
                      key={apt.id}
                      className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            apt.priority === 'high' 
                              ? darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                              : apt.priority === 'medium'
                              ? darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'
                              : darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{apt.title}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{apt.time}</p>
                          </div>
                        </div>
                        <div className={`mt-2 ml-9 grid grid-cols-2 gap-x-4 gap-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2" />
                            {apt.agency}
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {apt.contact}
                          </div>
                          {apt.alert?.enabled && (
                            <div className="flex items-center">
                              <Bell className="w-4 h-4 mr-2" />
                              Rappel {apt.alert.time} min avant
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed' 
                            ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                            : apt.status === 'late'
                            ? darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                            : darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.status === 'completed' ? 'Effectué' : 
                           apt.status === 'late' ? 'En retard' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {getAppointmentsForDate(selectedDate).length === 0 && (
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                      Aucun rendez-vous prévu pour cette date
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Bell className="w-5 h-5 mr-2 text-blue-600" />
                  Alertes de relance
                </h2>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {alerts.filter(a => a.status === 'pending').length} en attente
                  </span>
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {alerts.filter(a => a.status === 'late').length} en retard
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.status === 'completed' 
                        ? darkMode ? 'border-green-800 bg-green-900' : 'border-green-100 bg-green-50'
                        : alert.status === 'late'
                        ? darkMode ? 'border-red-800 bg-red-900' : 'border-red-100 bg-red-50'
                        : darkMode ? 'border-orange-800 bg-orange-900' : 'border-orange-100 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.company}</h3>
                        </div>
                        <div className={`mt-1 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Clock className="w-4 h-4" />
                          <span>{format(alert.date, 'd MMMM yyyy', { locale: fr })}</span>
                        </div>
                        <div className={`mt-1 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <MapPin className="w-4 h-4" />
                          <span>{alert.agency}</span>
                        </div>
                        {alert.description && (
                          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{alert.description}</p>
                        )}
                        {alert.action && (
                          <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{alert.action}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div className={`flex items-center gap-2 text-sm ${
                        alert.status === 'completed' 
                          ? darkMode ? 'text-green-400' : 'text-green-600'
                          : alert.status === 'late'
                          ? darkMode ? 'text-red-400' : 'text-red-600'
                          : darkMode ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {alert.status === 'completed' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Effectué
                          </>
                        ) : alert.status === 'late' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            En retard
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            En attente
                          </>
                        )}
                      </div>

                      {alert.status !== 'completed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(alert.id, 'completed')}
                            className={`px-3 py-1 text-xs ${darkMode ? 'bg-gray-700 text-green-400 hover:bg-green-900/50' : 'bg-white text-green-600 hover:bg-green-50'} rounded-lg border ${darkMode ? 'border-green-800' : 'border-green-200'}`}
                          >
                            Marquer effectué
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                    Aucune alerte de relance pour le moment
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAppointmentForm && (
        <AppointmentForm
          onSubmit={handleAddAppointment}
          onClose={() => setShowAppointmentForm(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default RendezVous;