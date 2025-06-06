import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isEqual } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '../stores/themeStore';

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  alerts?: Array<{
    date: Date;
    status: 'pending' | 'completed' | 'late';
  }>;
}

function CalendarView({ currentDate, selectedDate, onDateSelect, alerts = [] }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const { darkMode } = useThemeStore();

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getDateStatus = (date: Date) => {
    const alertsForDate = alerts.filter(alert => 
      isEqual(new Date(alert.date), date)
    );
    
    if (alertsForDate.length === 0) return null;
    
    if (alertsForDate.some(alert => alert.status === 'late')) {
      return 'late';
    }
    if (alertsForDate.some(alert => alert.status === 'pending')) {
      return 'pending';
    }
    return 'completed';
  };

  const getStatusStyles = (status: string | null) => {
    switch (status) {
      case 'late':
        return 'border-2 border-red-500';
      case 'pending':
        return 'border-2 border-orange-500';
      case 'completed':
        return 'border-2 border-green-500';
      default:
        return 'border border-transparent';
    }
  };

  return (
    <div className={darkMode ? 'text-white' : 'text-gray-900'}>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className={`text-center text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} py-2`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date) => {
          const isSelected = selectedDate ? isEqual(date, selectedDate) : false;
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);
          const status = getDateStatus(date);

          return (
            <button
              key={date.toString()}
              onClick={() => onDateSelect(date)}
              className={`
                relative h-12 rounded-full text-sm font-medium transition-all
                ${!isCurrentMonth && (darkMode ? 'text-gray-600' : 'text-gray-300')}
                ${isSelected ? 'bg-blue-600 text-white border-transparent' : getStatusStyles(status)}
                ${isCurrentDay && !isSelected && (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600')}
                ${isCurrentMonth && !isSelected && !isCurrentDay && (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')}
              `}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {format(date, 'd')}
              </span>
              {status && !isSelected && (
                <span className={`
                  absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full
                  ${status === 'late' ? 'bg-red-500' : 
                    status === 'pending' ? 'bg-orange-500' : 
                    'bg-green-500'}
                `} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-red-500"></span>
          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>En retard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-orange-500"></span>
          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-green-500"></span>
          <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Effectué</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;