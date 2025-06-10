import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Bell, Calendar, MapPin, Clock, Building2, User, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import { useAppointmentsStore, Appointment } from '../stores/appointmentsStore';
import { useAlertsStore, Alert } from '../stores/alertsStore';

function RendezVous() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { darkMode } = useThemeStore();
  
  // Get appointments and alerts from stores
  const { 
    appointments, 
    isLoading: isLoadingAppointments, 
    loadAppointments, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment,
    updateAppointmentStatus
  } = useAppointmentsStore();
  
  const { 
    alerts, 
    isLoading: isLoadingAlerts, 
    loadAlerts, 
    updateAlertStatus,
    addAlert
  } = useAlertsStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Load data from Firestore
      loadAppointments();
      loadAlerts();
    });

    return () => unsubscribe();
  }, [navigate, loadAppointments, loadAlerts]);

  // Synchroniser les rendez-vous et les alertes
  useEffect(() => {
    const syncAppointmentsWithAlerts = async () => {
      if (isLoadingAppointments || isLoadingAlerts) return;
      
      // Pour chaque rendez-vous, vérifier s'il existe une alerte correspondante
      for (const appointment of appointments) {
        const matchingAlert = alerts.find(alert => 
          alert.type === 'rendez-vous' && 
          alert.company === appointment.title &&
          new Date(alert.date).toDateString() === new Date(appointment.date).toDateString()
        );
        
        // Si le rendez-vous n'a pas d'alerte correspondante, en créer une
        if (!matchingAlert && appointment.alert?.enabled) {
          try {
            await addAlert({
              type: 'rendez-vous',
              company: appointment.title,
              date: appointment.date,
              agency: appointment.agency,
              status: appointment.status,
              step: 1,
              description: `Rendez-vous avec ${appointment.contact} (${appointment.agency})`,
              action: `Prévu le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${appointment.time}`
            });
          } catch (error) {
            console.error('Error creating alert for appointment:', error);
          }
        }
        
        // Si le statut du rendez-vous et de l'alerte ne correspondent pas, les synchroniser
        if (matchingAlert && matchingAlert.status !== appointment.status) {
          try {
            await updateAlertStatus(matchingAlert.id, appointment.status);
          } catch (error) {
            console.error('Error syncing alert status with appointment:', error);
          }
        }
      }
    };
    
    syncAppointmentsWithAlerts();
  }, [appointments, alerts, isLoadingAppointments, isLoadingAlerts, addAlert, updateAlertStatus]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddAppointment = async (data: any) => {
    try {
      const appointmentDate = new Date(`${data.date}T${data.time}`);
      
      // Calculate alert date if enabled
      let alertDate;
      if (data.enableAlert) {
        alertDate = new Date(appointmentDate);
        alertDate.setMinutes(alertDate.getMinutes() - parseInt(data.alertTime));
      }
      
      if (editingAppointment) {
        // Update existing appointment
        await updateAppointment(editingAppointment.id, {
          title: data.title,
          date: appointmentDate.toISOString(),
          time: data.time,
          agency: data.agency,
          contact: data.contact,
          priority: data.priority,
          alert: data.enableAlert ? {
            enabled: true,
            time: data.alertTime,
            type: data.alertType
          } : undefined,
          alertDate: alertDate?.toISOString()
        });
      } else {
        // Create new appointment
        await addAppointment({
          title: data.title,
          date: appointmentDate.toISOString(),
          time: data.time,
          agency: data.agency,
          contact: data.contact,
          priority: data.priority,
          status: 'pending',
          alert: data.enableAlert ? {
            enabled: true,
            time: data.alertTime,
            type: data.alertType
          } : undefined,
          alertDate: alertDate?.toISOString()
        });
      }
      
      setEditingAppointment(null);
      setShowAppointmentForm(false);
    } catch (error) {
      console.error('Error handling appointment:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleDeleteAppointment = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteAppointment(id);
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return isSameDay(aptDate, date);
    });
  };

  const getAlertsForCalendar = () => {
    return appointments.map(apt => ({
      date: new Date(apt.date),
      status: apt.status
    }));
  };

  const handleUpdateStatus = async (alertId: string, status: Alert['status']) => {
    try {
      await updateAlertStatus(alertId, status);
      
      // Trouver et mettre à jour le rendez-vous correspondant
      const alert = alerts.find(a => a.id === alertId);
      if (alert && alert.type === 'rendez-vous') {
        const matchingAppointment = appointments.find(apt => 
          apt.title === alert.company && 
          new Date(apt.date).toDateString() === new Date(alert.date).toDateString()
        );
        
        if (matchingAppointment) {
          await updateAppointmentStatus(matchingAppointment.id, status);
        }
      }
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
  };

  const handleMarkAppointmentComplete = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'completed');
    } catch (error) {
      console.error('Error marking appointment as complete:', error);
    }
  };

  const handleMarkAppointmentLate = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'late');
    } catch (error) {
      console.error('Error marking appointment as late:', error);
    }
  };

  const isLoading = isLoadingAppointments || isLoadingAlerts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  // Filtrer les alertes pour n'afficher que celles de type 'rendez-vous' et qui ne sont pas complétées
  const appointmentAlerts = alerts.filter(alert => 
    alert.type === 'rendez-vous' && 
    alert.status !== 'completed'
  );
  
  // Compter les alertes par statut
  const pendingAlertsCount = appointmentAlerts.filter(alert => alert.status === 'pending').length;
  const lateAlertsCount = appointmentAlerts.filter(alert => alert.status === 'late').length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rendez-vous</h1>
        <button
          onClick={() => {
            setEditingAppointment(null);
            setShowAppointmentForm(true);
          }}
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
                      <div className="flex flex-col items-end gap-2">
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
                        
                        <div className="flex gap-2">
                          {apt.status !== 'completed' && (
                            <button
                              onClick={() => handleMarkAppointmentComplete(apt.id)}
                              className={`px-2 py-1 text-xs ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-600'} rounded-lg hover:${darkMode ? 'bg-green-800' : 'bg-green-100'}`}
                            >
                              Marquer effectué
                            </button>
                          )}
                          
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAppointmentLate(apt.id)}
                              className={`px-2 py-1 text-xs ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
                            >
                              Marquer en retard
                            </button>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditAppointment(apt)}
                            className={`p-1.5 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'} transition-colors`}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(apt.id)}
                            className={`p-1.5 ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'} transition-colors`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {pendingAlertsCount} en attente
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'
                  }`}>
                    {lateAlertsCount} en retard
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {appointmentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.status === 'completed' 
                        ? darkMode ? 'border-green-800 bg-green-900/30' : 'border-green-100 bg-green-50'
                        : alert.status === 'late'
                        ? darkMode ? 'border-red-800 bg-red-900/30' : 'border-red-100 bg-red-50'
                        : darkMode ? 'border-orange-800 bg-orange-900/30' : 'border-orange-100 bg-orange-50'
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
                          <span>{format(new Date(alert.date), 'd MMMM yyyy', { locale: fr })}</span>
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

                {appointmentAlerts.length === 0 && (
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
          onClose={() => {
            setShowAppointmentForm(false);
            setEditingAppointment(null);
          }}
          selectedDate={selectedDate}
          appointment={editingAppointment}
        />
      )}
    </div>
  );
}

export default RendezVous;