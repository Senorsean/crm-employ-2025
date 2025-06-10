import React, { useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '../stores/themeStore';

interface AppointmentFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  selectedDate?: Date | null;
  appointment?: any;
}

function AppointmentForm({ onSubmit, onClose, selectedDate, appointment }: AppointmentFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: appointment ? {
      title: appointment.title,
      date: format(appointment.date, 'yyyy-MM-dd'),
      time: appointment.time,
      agency: appointment.agency,
      contact: appointment.contact,
      priority: appointment.priority,
      enableAlert: appointment.alert?.enabled || false,
      alertTime: appointment.alert?.time || '15',
      alertType: appointment.alert?.type || 'email'
    } : {
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      priority: 'normal',
      enableAlert: true,
      alertTime: '15',
      alertType: 'email'
    }
  });
  const { darkMode } = useThemeStore();

  const enableAlert = watch('enableAlert');

  const handleFormSubmit = (data: any) => {
    // Calculate alert date if enabled
    if (data.enableAlert) {
      const appointmentDate = new Date(`${data.date}T${data.time}`);
      const alertDate = addMinutes(appointmentDate, -parseInt(data.alertTime));
      data.alertDate = alertDate;
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-lg`}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {appointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Entreprise *
                </label>
                <input
                  type="text"
                  {...register("title", { required: "Ce champ est requis" })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                />
                {errors.title && (
                  <span className="text-sm text-red-600">{errors.title.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Date *
                  </label>
                  <input
                    type="date"
                    {...register("date", { required: "Ce champ est requis" })}
                    className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                  />
                  {errors.date && (
                    <span className="text-sm text-red-600">{errors.date.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Heure *
                  </label>
                  <input
                    type="time"
                    {...register("time", { required: "Ce champ est requis" })}
                    className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                  />
                  {errors.time && (
                    <span className="text-sm text-red-600">{errors.time.message}</span>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Agence *
                </label>
                <select
                  {...register("agency", { required: "Ce champ est requis" })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                >
                  <option value="">Sélectionner une agence</option>
                  <option value="Marseille 4">Marseille 4</option>
                  <option value="Marseille 16">Marseille 16</option>
                  <option value="Vitrolles">Vitrolles</option>
                  <option value="Marignane">Marignane</option>
                  <option value="Arles">Arles</option>
                  <option value="Brignoles">Brignoles</option>
                </select>
                {errors.agency && (
                  <span className="text-sm text-red-600">{errors.agency.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Contact *
                </label>
                <input
                  type="text"
                  {...register("contact", { required: "Ce champ est requis" })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                  placeholder="Nom du contact"
                />
                {errors.contact && (
                  <span className="text-sm text-red-600">{errors.contact.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Priorité
                </label>
                <select
                  {...register("priority")}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                >
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="normal">Normale</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("enableAlert")}
                    className={`h-4 w-4 text-anthea-blue rounded border-gray-300 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                  <label className={`ml-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                    <Bell className="w-4 h-4 mr-1" />
                    Activer une alerte
                  </label>
                </div>

                {enableAlert && (
                  <div className="pl-6 space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Rappel avant le rendez-vous
                      </label>
                      <select
                        {...register("alertTime")}
                        className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="120">2 heures</option>
                        <option value="1440">1 jour</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Type de notification
                      </label>
                      <select
                        {...register("alertType")}
                        className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 text-gray-900'} p-2.5`}
                      >
                        <option value="email">Email</option>
                        <option value="notification">Notification</option>
                        <option value="both">Email et notification</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-b-xl flex justify-end gap-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'} rounded-xl transition-colors`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-anthea text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              {appointment ? 'Enregistrer les modifications' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentForm;