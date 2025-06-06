import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { UseFieldArrayReturn } from 'react-hook-form';
import { ContactFields } from './ContactFields';
import { CompanyFormData } from './types';

interface ContactsListProps {
  fieldArray: UseFieldArrayReturn<CompanyFormData, "contacts", "id">;
  register: any;
}

export function ContactsList({ fieldArray, register }: ContactsListProps) {
  const { fields, append, remove } = fieldArray;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">Contacts</h3>
        <button
          type="button"
          onClick={() => append({ name: '', role: '', email: '', phone: '' })}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Ajouter un contact
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between mb-4">
              <h4 className="font-medium">Contact {index + 1}</h4>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <ContactFields index={index} register={register} />
          </div>
        ))}
      </div>
    </div>
  );
}