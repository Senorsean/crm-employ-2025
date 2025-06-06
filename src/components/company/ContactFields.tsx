import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { CompanyFormData } from './types';

interface ContactFieldsProps {
  index: number;
  register: UseFormRegister<CompanyFormData>;
}

export function ContactFields({ index, register }: ContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nom</label>
          <input
            type="text"
            {...register(`contacts.${index}.name`)}
            className="w-full rounded-lg border border-gray-200 p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Fonction</label>
          <input
            type="text"
            {...register(`contacts.${index}.role`)}
            className="w-full rounded-lg border border-gray-200 p-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            {...register(`contacts.${index}.email`)}
            className="w-full rounded-lg border border-gray-200 p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
          <input
            type="tel"
            {...register(`contacts.${index}.phone`)}
            className="w-full rounded-lg border border-gray-200 p-2"
          />
        </div>
      </div>
    </div>
  );
}