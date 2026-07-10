import { useState } from 'react';
import confetti from 'canvas-confetti';
import { CalendarHeart, X } from 'lucide-react';
import type { SavedDate } from '../types';

interface DateFormProps {
  onClose: () => void;
  onSave: (date: SavedDate) => void;
  initialData?: SavedDate | null;
}

export default function DateForm({ onClose, onSave, initialData }: DateFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [siteName, setSiteName] = useState(initialData?.siteName || '');
  const [activityName, setActivityName] = useState(initialData?.activityName || '');
  const [date, setDate] = useState(initialData?.date || '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    onSave({
      ...initialData,
      id: initialData?.id || Date.now().toString(),
      siteName,
      activityName,
      date,
      photos: initialData?.photos || [],
      completed: initialData?.completed || false,
      completedAt: initialData?.completedAt || null,
      notes: initialData?.notes || '',
    });

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ffc0cb', '#ff69b4', '#8a2be2'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffc0cb', '#ff69b4', '#8a2be2'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="glass-panel relative w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CalendarHeart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-cursive font-bold text-purple-900 mb-2">
              {initialData ? '¡Cita Actualizada!' : '¡Cita Programada!'}
            </h2>
            <p className="text-gray-700">Prepárate para un momento inolvidable.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-cursive font-bold text-purple-900">
                {initialData ? 'Editar Cita' : 'Nuestra Próxima Cita'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {initialData ? 'Modifica los detalles de la cita' : 'Completa los detalles para nuestra aventura'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿A dónde iremos?
                </label>
                <input
                  required
                  id="site-name"
                  type="text"
                  value={siteName}
                  onChange={(event) => setSiteName(event.target.value)}
                  placeholder="Ej. Restaurante Italiano, El parque..."
                  className="w-full rounded-lg bg-white/50 border border-purple-200 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="activity-name" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Qué haremos?
                </label>
                <input
                  required
                  id="activity-name"
                  type="text"
                  value={activityName}
                  onChange={(event) => setActivityName(event.target.value)}
                  placeholder="Ej. Cenar, ver una película, caminar..."
                  className="w-full rounded-lg bg-white/50 border border-purple-200 px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Cuándo?
                </label>
                <input
                  required
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-lg bg-white/50 border border-purple-200 px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-[0.98]"
              >
                {initialData ? 'Guardar Cambios' : 'Confirmar Cita'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
