import { useState } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';
import type { SavedDate } from '../types';
import PhotoUploader from './PhotoUploader';

interface DateListProps {
  dates: SavedDate[];
  onEdit: (date: SavedDate) => void;
  onDelete: (id: string) => void;
  onToggleCompleted: (dateId: string, completed: boolean) => void | Promise<void>;
  onNotesUpdated: (dateId: string, notes: string) => void | Promise<void>;
  onPhotosUpdated: (dateId: string, newPhotoUrls: string[]) => void | Promise<void>;
}

export default function DateList({
  dates,
  onEdit,
  onDelete,
  onToggleCompleted,
  onNotesUpdated,
  onPhotosUpdated,
}: DateListProps) {
  const [uploadingDateId, setUploadingDateId] = useState<string | null>(null);
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

  const handleToggleCompleted = async (date: SavedDate) => {
    const nextCompleted = !date.completed;
    await onToggleCompleted(date.id, nextCompleted);

    if (nextCompleted) {
      setExpandedDateId(date.id);
      setNotesDrafts((currentDrafts) => ({
        ...currentDrafts,
        [date.id]: currentDrafts[date.id] ?? date.notes ?? '',
      }));
    } else if (expandedDateId === date.id) {
      setExpandedDateId(null);
    }
  };

  const handleSaveNotes = async (date: SavedDate) => {
    setSavingNotesId(date.id);

    try {
      await onNotesUpdated(date.id, notesDrafts[date.id] ?? date.notes ?? '');
    } finally {
      setSavingNotesId(null);
    }
  };

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

      <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
        {dates.map((date) => {
          const isExpanded = expandedDateId === date.id;
          const notesDraft = notesDrafts[date.id] ?? date.notes ?? '';

          return (
            <div
              key={date.id}
              className={`bg-white/40 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
                date.completed ? 'border-emerald-200/80' : 'border-white/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-lg text-gray-800">{date.siteName}</h4>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                        date.completed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {date.completed && <Check className="h-3 w-3" />}
                      {date.completed ? 'Cita realizada' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-2">{date.activityName}</p>
                  <span className="text-xs text-pink-600 font-bold bg-pink-100/50 inline-block px-2 py-1 rounded-md">
                    {new Date(`${date.date}T00:00:00`).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleCompleted(date)}
                    className={`p-2 rounded-lg transition-colors ${
                      date.completed
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                    title={date.completed ? 'Marcar como pendiente' : 'Marcar como realizada'}
                    aria-label={date.completed ? 'Marcar como pendiente' : 'Marcar como realizada'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(date)}
                    className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-700 rounded-lg transition-colors"
                    title="Editar cita"
                    aria-label="Editar cita"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(date.id)}
                    className="p-2 bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 rounded-lg transition-colors"
                    title="Eliminar cita"
                    aria-label="Eliminar cita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {date.completed && (
                <div className="mt-4 border-t border-emerald-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setExpandedDateId(isExpanded ? null : date.id)}
                    className="flex w-full items-center justify-between rounded-xl bg-emerald-50/80 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Notas y recuerdos de la cita</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {!isExpanded && date.notes && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-sm text-gray-700">
                      {date.notes}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor={`notes-${date.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          ¿Cómo estuvo la cita?
                        </label>
                        <textarea
                          id={`notes-${date.id}`}
                          value={notesDraft}
                          onChange={(event) =>
                            setNotesDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [date.id]: event.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Escribe lo que más les gustó, momentos especiales o algo que quieran recordar..."
                          className="w-full resize-y rounded-xl border border-purple-200 bg-white/70 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(date)}
                          disabled={savingNotesId === date.id}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          {savingNotesId === date.id ? 'Guardando...' : 'Guardar nota'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadingDateId(date.id)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-600"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Agregar fotos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {date.photos && date.photos.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/40 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {date.photos.map((url, index) => (
                    <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                      <img
                        src={url}
                        alt={`Recuerdo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-white shadow-sm hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {uploadingDateId && (
        <PhotoUploader
          dateId={uploadingDateId}
          onClose={() => setUploadingDateId(null)}
          onUploadSuccess={(urls) => onPhotosUpdated(uploadingDateId, urls)}
        />
      )}
    </div>
  );
}
