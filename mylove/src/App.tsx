import { useState, useEffect } from 'react';
import './App.css';
import DateForm from './components/DateForm';
import DateList from './components/DateList';
import { HeartHandshake } from 'lucide-react';
import type { SavedDate } from './types';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const STORAGE_KEY = 'mylove-dates';

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

  // Cargar citas desde Firestore en tiempo real
  useEffect(() => {
    try {
      const storedDates = window.localStorage.getItem(STORAGE_KEY);
      if (storedDates) {
        const parsedDates = JSON.parse(storedDates) as SavedDate[];
        setDates(sortDates(parsedDates));
      }
    } catch (error) {
      console.warn('No se pudo leer el respaldo local:', error);
    }

    const unsubscribe = onSnapshot(
      collection(db, 'dates'),
      (querySnapshot) => {
        const datesData: SavedDate[] = querySnapshot.docs.map((docSnapshot) => ({
          ...(docSnapshot.data() as SavedDate),
          id: docSnapshot.id,
        }));

        const sortedDates = sortDates(datesData);
        setDates(sortedDates);
        saveDatesToStorage(sortedDates);
        setErrorMessage(null);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando citas de Firestore: ', error);
        setLoading(false);
        setErrorMessage(
          `No se pudo cargar el historial. Código: ${error.code || 'unknown'}. Mensaje: ${error.message || 'sin descripción'}. Revisa las reglas de Firestore, App Check o la configuración del proyecto.`
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSaveDate = async (newDate: SavedDate) => {
    const nextDates = (prevDates: SavedDate[]) => {
      const exists = prevDates.some(d => d.id === newDate.id);
      const updatedDates = exists
        ? prevDates.map(d => d.id === newDate.id ? newDate : d)
        : [newDate, ...prevDates];
      return sortDates(updatedDates);
    };

    setDates(prevDates => {
      const updatedDates = nextDates(prevDates);
      saveDatesToStorage(updatedDates);
      return updatedDates;
    });

    try {
      await setDoc(doc(db, 'dates', newDate.id), { ...newDate, id: newDate.id });
    } catch (error) {
      console.error('Error guardando cita: ', error);
      setErrorMessage('Se guardó localmente, pero Firestore no aceptó la escritura. Revisa permisos o configuración del proyecto.');
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      setDates(prevDates => {
        const updatedDates = prevDates.filter(d => d.id !== id);
        saveDatesToStorage(updatedDates);
        return updatedDates;
      });

      try {
        await deleteDoc(doc(db, 'dates', id));
      } catch (error) {
        console.error('Error eliminando cita: ', error);
        setErrorMessage('Se eliminó localmente, pero Firestore no aceptó la eliminación.');
      }
    }
  };

  const handleEditDate = (date: SavedDate) => {
    setEditingDate(date);
    setIsModalOpen(true);
  };

  const handlePhotosUpdated = async (dateId: string, newPhotoUrl: string) => {
    setDates(prevDates => {
      const updatedDates = prevDates.map(d => {
        if (d.id === dateId) {
          return { ...d, photos: [...(d.photos || []), newPhotoUrl] };
        }
        return d;
      });
      saveDatesToStorage(updatedDates);
      return updatedDates;
    });

    try {
      const dateRef = doc(db, 'dates', dateId);
      await updateDoc(dateRef, {
        photos: arrayUnion(newPhotoUrl)
      });
    } catch (error) {
      console.error('Error actualizando fotos: ', error);
      setErrorMessage('La imagen se guardó localmente, pero Firestore no aceptó la referencia.');
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
      {/* Navbar / Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="font-cursive text-6xl md:text-7xl lg:text-8xl font-bold text-pink-600 drop-shadow-sm flex items-center justify-center gap-4">
          <HeartHandshake className="w-12 h-12 lg:w-16 lg:h-16 text-pink-500" />
          Nuestro Espacio
        </h1>
        <p className="text-purple-800 text-lg md:text-xl font-medium mt-2">
          Donde planeamos nuestros mejores momentos
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 mt-8 max-w-5xl">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            <DateList 
              dates={dates} 
              onEdit={handleEditDate} 
              onDelete={handleDeleteDate}
              onPhotosUpdated={handlePhotosUpdated}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8 flex flex-col justify-start">
            
            {/* Main Call to Action */}
            <div className="glass-panel rounded-3xl p-10 text-center shadow-xl border border-white/40">
              <h2 className="text-3xl font-cursive font-bold text-purple-900 mb-4">¿Lista para otra aventura?</h2>
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

      {/* Modal */}
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
