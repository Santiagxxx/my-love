import { useEffect, useState } from 'react';
import './App.css';
import DateForm from './components/DateForm';
import DateList from './components/DateList';
import { HeartHandshake } from 'lucide-react';
import type { SavedDate } from './types';
import { db, ensureAuthenticated } from './firebase';
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';

const STORAGE_KEY = 'mylove-dates';

function getFirebaseError(error: unknown): { code: string; message: string } {
  if (error && typeof error === 'object') {
    const firebaseError = error as { code?: string; message?: string };
    return {
      code: firebaseError.code || 'unknown',
      message: firebaseError.message || 'Sin descripción',
    };
  }

  return { code: 'unknown', message: String(error) };
}

function getConnectionErrorMessage(error: unknown): string {
  const { code, message } = getFirebaseError(error);

  if (code === 'auth/operation-not-allowed') {
    return 'Firebase Authentication no tiene habilitado el acceso anónimo. Actívalo para sincronizar citas, notas e imágenes.';
  }

  if (code === 'permission-denied') {
    return 'Firestore rechazó el acceso. Publica las reglas incluidas en el repositorio.';
  }

  return `No se pudo conectar con Firebase. Código: ${code}. ${message}`;
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dates, setDates] = useState<SavedDate[]>([]);
  const [editingDate, setEditingDate] = useState<SavedDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveDatesToStorage = (items: SavedDate[]) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  };

  const sortDates = (items: SavedDate[]) =>
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const updateDateLocally = (
    dateId: string,
    updater: (currentDate: SavedDate) => SavedDate
  ) => {
    setDates((currentDates) => {
      const updatedDates = sortDates(
        currentDates.map((currentDate) =>
          currentDate.id === dateId ? updater(currentDate) : currentDate
        )
      );
      saveDatesToStorage(updatedDates);
      return updatedDates;
    });
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const storedDates = window.localStorage.getItem(STORAGE_KEY);
      if (storedDates) {
        const parsedDates = JSON.parse(storedDates) as SavedDate[];
        setDates(sortDates(parsedDates));
      }
    } catch (error) {
      console.warn('No se pudo leer el respaldo local:', error);
    }

    const connectToFirebase = async () => {
      try {
        await ensureAuthenticated();

        if (!isMounted) {
          return;
        }

        unsubscribe = onSnapshot(
          collection(db, 'dates'),
          (querySnapshot) => {
            const datesData: SavedDate[] = querySnapshot.docs.map((documentSnapshot) => ({
              ...(documentSnapshot.data() as SavedDate),
              id: documentSnapshot.id,
            }));

            const sortedDates = sortDates(datesData);
            setDates(sortedDates);
            saveDatesToStorage(sortedDates);
            setErrorMessage(null);
            setLoading(false);
          },
          (error) => {
            console.error('Error cargando citas de Firestore:', error);
            setLoading(false);
            setErrorMessage(getConnectionErrorMessage(error));
          }
        );
      } catch (error) {
        console.error('Error autenticando con Firebase:', error);
        if (isMounted) {
          setLoading(false);
          setErrorMessage(getConnectionErrorMessage(error));
        }
      }
    };

    void connectToFirebase();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const handleSaveDate = async (newDate: SavedDate) => {
    setDates((currentDates) => {
      const exists = currentDates.some((currentDate) => currentDate.id === newDate.id);
      const updatedDates = sortDates(
        exists
          ? currentDates.map((currentDate) =>
              currentDate.id === newDate.id ? newDate : currentDate
            )
          : [newDate, ...currentDates]
      );
      saveDatesToStorage(updatedDates);
      return updatedDates;
    });

    try {
      await ensureAuthenticated();
      await setDoc(doc(db, 'dates', newDate.id), newDate, { merge: true });
      setErrorMessage(null);
    } catch (error) {
      console.error('Error guardando cita:', error);
      setErrorMessage(
        `La cita quedó guardada en este dispositivo, pero no se sincronizó. ${getConnectionErrorMessage(error)}`
      );
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return;
    }

    setDates((currentDates) => {
      const updatedDates = currentDates.filter((currentDate) => currentDate.id !== id);
      saveDatesToStorage(updatedDates);
      return updatedDates;
    });

    try {
      await ensureAuthenticated();
      await deleteDoc(doc(db, 'dates', id));
      setErrorMessage(null);
    } catch (error) {
      console.error('Error eliminando cita:', error);
      setErrorMessage(
        `La cita se eliminó en este dispositivo, pero no se sincronizó. ${getConnectionErrorMessage(error)}`
      );
    }
  };

  const handleEditDate = (date: SavedDate) => {
    setEditingDate(date);
    setIsModalOpen(true);
  };

  const handleToggleCompleted = async (dateId: string, completed: boolean) => {
    const completedAt = completed ? new Date().toISOString() : null;

    updateDateLocally(dateId, (currentDate) => ({
      ...currentDate,
      completed,
      completedAt,
    }));

    try {
      await ensureAuthenticated();
      await setDoc(
        doc(db, 'dates', dateId),
        { completed, completedAt },
        { merge: true }
      );
      setErrorMessage(null);
    } catch (error) {
      console.error('Error actualizando el estado de la cita:', error);
      setErrorMessage(
        `El estado se guardó en este dispositivo, pero no se sincronizó. ${getConnectionErrorMessage(error)}`
      );
    }
  };

  const handleNotesUpdated = async (dateId: string, notes: string) => {
    updateDateLocally(dateId, (currentDate) => ({ ...currentDate, notes }));

    try {
      await ensureAuthenticated();
      await setDoc(doc(db, 'dates', dateId), { notes }, { merge: true });
      setErrorMessage(null);
    } catch (error) {
      console.error('Error guardando notas:', error);
      setErrorMessage(
        `La nota se guardó en este dispositivo, pero no se sincronizó. ${getConnectionErrorMessage(error)}`
      );
    }
  };

  const handlePhotosUpdated = async (dateId: string, newPhotoUrls: string[]) => {
    if (newPhotoUrls.length === 0) {
      return;
    }

    updateDateLocally(dateId, (currentDate) => ({
      ...currentDate,
      photos: Array.from(new Set([...(currentDate.photos || []), ...newPhotoUrls])),
    }));

    try {
      await ensureAuthenticated();
      await setDoc(
        doc(db, 'dates', dateId),
        { photos: arrayUnion(...newPhotoUrls) },
        { merge: true }
      );
      setErrorMessage(null);
    } catch (error) {
      console.error('Error guardando referencias de fotos:', error);
      setErrorMessage(
        `Las imágenes se subieron, pero sus referencias no se sincronizaron. ${getConnectionErrorMessage(error)}`
      );
    }
  };

  const openNewDateModal = () => {
    setEditingDate(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-purple-800 font-medium">Cargando nuestro espacio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="pt-8 pb-4 text-center">
        <h1 className="font-cursive text-6xl md:text-7xl lg:text-8xl font-bold text-pink-600 drop-shadow-sm flex items-center justify-center gap-4">
          <HeartHandshake className="w-12 h-12 lg:w-16 lg:h-16 text-pink-500" />
          Nuestro Espacio
        </h1>
        <p className="text-purple-800 text-lg md:text-xl font-medium mt-2">
          Donde planeamos nuestros mejores momentos
        </p>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-5xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <DateList
              dates={dates}
              onEdit={handleEditDate}
              onDelete={handleDeleteDate}
              onToggleCompleted={handleToggleCompleted}
              onNotesUpdated={handleNotesUpdated}
              onPhotosUpdated={handlePhotosUpdated}
            />
          </div>

          <div className="space-y-8 flex flex-col justify-start">
            <div className="glass-panel rounded-3xl p-10 text-center shadow-xl border border-white/40">
              <h2 className="text-3xl font-cursive font-bold text-purple-900 mb-4">
                ¿Lista para otra aventura?
              </h2>
              <p className="text-gray-700 mb-8">
                Programa nuestra próxima cita. Prometo que será increíble.
              </p>
              <button
                onClick={openNewDateModal}
                className="bg-purple-600 hover:bg-purple-500 text-white text-lg font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
              >
                Agendar Cita Ahora
              </button>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <DateForm
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDate}
          initialData={editingDate}
        />
      )}
    </div>
  );
}

export default App;
