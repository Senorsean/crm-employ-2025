import React from 'react';
import { CVData } from '../../types/cv';

interface ParsedDataPreviewProps {
  data: CVData;
}

export function ParsedDataPreview({ data }: ParsedDataPreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700">Informations personnelles</h3>
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-600">
            Nom : {data.firstName} {data.lastName}
          </p>
          <p className="text-sm text-gray-600">Email : {data.email}</p>
          <p className="text-sm text-gray-600">Téléphone : {data.phone}</p>
          <p className="text-sm text-gray-600">Localisation : {data.location}</p>
        </div>
      </div>

      {data.experiences && data.experiences.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Expériences</h3>
          <div className="mt-2 space-y-3">
            {data.experiences.map((exp, index) => (
              <div key={index} className="text-sm text-gray-600">
                <p className="font-medium">{exp.title}</p>
                <p>{exp.company}</p>
                <p className="text-gray-500">{exp.period}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700">Compétences</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}