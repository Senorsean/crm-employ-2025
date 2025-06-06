import React from 'react';
import DocumentExplorer from '../components/documents/DocumentExplorer';

export default function Documents() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Documents</h1>
      <DocumentExplorer />
    </div>
  );
}