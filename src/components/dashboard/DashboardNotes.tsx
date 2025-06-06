import React, { useState } from 'react';
import { StickyNote, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  color: string;
}

export function DashboardNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FEF3C7'); // Default yellow

  const colors = [
    { value: '#FEF3C7', label: 'Jaune' },
    { value: '#DBEAFE', label: 'Bleu' },
    { value: '#DCF9E6', label: 'Vert' },
    { value: '#FEE2E2', label: 'Rouge' },
    { value: '#F3E8FF', label: 'Violet' }
  ];

  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      content: noteContent.trim(),
      createdAt: new Date(),
      color: selectedColor
    };

    setNotes(prev => [newNote, ...prev]);
    setNoteContent('');
    setShowAddNote(false);
  };

  const handleEditNote = (noteId: string) => {
    if (!noteContent.trim()) return;

    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: noteContent.trim() }
        : note
    ));
    setEditingNote(null);
    setNoteContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold flex items-center">
            <StickyNote className="w-5 h-5 mr-2 text-blue-600" />
            Notes
          </h2>
          <button
            onClick={() => setShowAddNote(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle note
          </button>
        </div>

        {/* Formulaire d'ajout/édition */}
        {(showAddNote || editingNote) && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Contenu de la note..."
              className="w-full p-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            
            {showAddNote && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600">Couleur :</span>
                {colors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-6 h-6 rounded-full ${
                      selectedColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddNote(false);
                  setEditingNote(null);
                  setNoteContent('');
                }}
                className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 mr-1" />
                Annuler
              </button>
              <button
                onClick={() => editingNote ? handleEditNote(editingNote) : handleAddNote()}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Check className="w-4 h-4 mr-1" />
                {editingNote ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des notes */}
        <div className="space-y-4">
          {notes.map(note => (
            <div
              key={note.id}
              className="p-4 rounded-lg relative group"
              style={{ backgroundColor: note.color }}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingNote(note.id);
                    setNoteContent(note.content);
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg mr-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 hover:bg-white/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="whitespace-pre-wrap">{note.content}</p>
              <p className="text-sm text-gray-600 mt-2">
                {note.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))}

          {notes.length === 0 && !showAddNote && (
            <p className="text-center text-gray-500 py-4">
              Aucune note pour le moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}