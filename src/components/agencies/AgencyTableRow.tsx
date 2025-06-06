import React from 'react';
import { Building2 } from 'lucide-react';
import type { Agency } from '../../types/agency';
import { useThemeStore } from '../../stores/themeStore';

interface AgencyTableRowProps {
  agency: Agency;
  onClick: () => void;
  selected: boolean;
  onSelect: () => void;
}

export function AgencyTableRow({ agency, onClick, selected, onSelect }: AgencyTableRowProps) {
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
    <tr 
      className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer`}
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Building2 className="w-5 h-5 text-anthea-blue" />
          </div>
          <div className="ml-4">
            <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agency.name}</div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {agency.consultants?.length || 0} consultant{(agency.consultants?.length || 0) > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
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
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <a 
            href={`tel:${formatPhoneForLink(agency.phone)}`} 
            className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} block ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {agency.phone}
          </a>
          <a 
            href={`mailto:${agency.email}`} 
            className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} block ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {agency.email}
          </a>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          {agency.consultants?.map((consultant) => (
            <div key={consultant.id} className="mb-1">
              {consultant.name}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}