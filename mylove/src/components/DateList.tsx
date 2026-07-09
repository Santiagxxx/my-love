import { useState } from 'react';
import { Pencil, Trash2, CalendarDays, ImagePlus } from 'lucide-react';
import type { SavedDate } from '../types';
import PhotoUploader from './PhotoUploader';

interface DateListProps {
  dates: SavedDate[];
  onEdit: (date: SavedDate) => void;
  onDelete: (id: string) => void;
  onPhotosUpdated: (dateId: string, newPhotoUrl: string) => void;
}

export default function DateList({ dates, onEdit, onDelete, onPhotosUpdated }: DateListProps) {
  const [uploadingDateId, setUploadingDateId] = useState<string | null>(null);

  if (dates.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center shadow-lg w-full">
        <CalendarDays className="w-12 h-12 text-pink-400 mx-auto mb-3 opacity-50" />
        <h3 className="text-xl font-medium text-purple-900 mb-2">Sin citas programadas</h3>
        <p className="text-gray-600">Aún no hay citas guardadas. ¡Anímate a programar la primera!</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-lg w-full">
      <h3 className="text-2xl font-cursive font-bold text-purple-900 mb-6 flex items-center gap-2">
        <CalendarDays className="text-pink-500 w-6 h-6" />
        Nuestras Citas Guardadas
      </h3>
      
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {dates.map((date) => (
          <div 
            key={date.id} 
            className="bg-white/40 border border-white/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-lg text-gray-800">{date.siteName}</h4>
                <p className="text-sm text-gray-700 font-medium mb-2">{date.activityName}</p>
                <span className="text-xs text-pink-600 font-bold bg-pink-100/50 inline-block px-2 py-1 rounded-md">
                  {new Date(date.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setUploadingDateId(date.id)}
                  className="p-2 bg-pink-100 text-pink-600 hover:bg-pink-200 hover:text-pink-700 rounded-lg transition-colors"
                  title="Añadir foto"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(date)}
                  className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 rounded-lg transition-colors"
                  title="Editar cita"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(date.id)}
                  className="p-2 bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 rounded-lg transition-colors"
                  title="Eliminar cita"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Galería de fotos pequeña */}
            {date.photos && date.photos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/40 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {date.photos.map((url, index) => (
                  <a key={index} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                    <img 
                      src={url} 
                      alt={`Recuerdo ${index + 1}`} 
                      className="w-16 h-16 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform" 
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {uploadingDateId && (
        <PhotoUploader 
          dateId={uploadingDateId}
          onClose={() => setUploadingDateId(null)}
          onUploadSuccess={(url) => onPhotosUpdated(uploadingDateId, url)}
        />
      )}
    </div>
  );
}
