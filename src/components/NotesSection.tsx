import React, { useState } from 'react';
import { MessageSquarePlus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '../stores/themeStore';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
}

interface NotesSectionProps {
  notes: Note[];
  onAddNote: (content: string) => void;
}

function NotesSection({ notes: initialNotes, onAddNote }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNote, setNewNote] = useState('');
  const { darkMode } = useThemeStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date(),
        author: "Sophie Dubois" // À remplacer par l'utilisateur connecté
      };
      
      setNotes(prevNotes => [note, ...prevNotes]);
      onAddNote(newNote);
      setNewNote('');
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
      <div className="p-6">
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
          <MessageSquarePlus className="w-5 h-5 mr-2 text-blue-600" />
          Notes de suivi
        </h2>

        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajouter une note..."
            className={`w-full p-3 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newNote.trim()}
            >
              Ajouter la note
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <p className={`${darkMode ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap`}>{note.content}</p>
              <div className={`mt-3 flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  {format(note.createdAt, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </span>
                <span className="mx-2">•</span>
                <span>{note.author}</span>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
              Aucune note pour le moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesSection;