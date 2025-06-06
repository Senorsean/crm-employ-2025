import React from 'react';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import type { Agency } from '../../types/agency';
import { useThemeStore } from '../../stores/themeStore';

interface AgencyCardProps {
  agency: Agency;
  onClick: () => void;
}

export function AgencyCard({ agency, onClick }: AgencyCardProps) {
  const { darkMode } = useThemeStore();
  
  // Format phone number for tel: links by removing spaces, dots, etc.
  const formatPhoneForLink = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/[\s\.\-\(\)]/g, '');
  };

  // Create a maps URL for the address
  const getMapsUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}`;
  };

  return (
    <div 
      className={`border ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:shadow-md'} rounded-2xl p-4 transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gradient-anthea rounded-xl">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agency.name}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {agency.consultants?.length || 0} consultant{(agency.consultants?.length || 0) > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <a 
            href={getMapsUrl(agency.address)} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
            onClick={(e) => e.stopPropagation()}
          >
            {agency.address}
          </a>
        </div>
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
          <a 
            href={`tel:${formatPhoneForLink(agency.phone)}`} 
            className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {agency.phone}
          </a>
        </div>
        <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
          <a 
            href={`mailto:${agency.email}`} 
            className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {agency.email}
          </a>
        </div>
      </div>
    </div>
  );
}