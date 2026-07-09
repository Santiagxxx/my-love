import { useState, useEffect } from 'react';
import './App.css';
import DateForm from './components/DateForm';
import Countdown from './components/Countdown';
import LoveNotes from './components/LoveNotes';
import DateList from './components/DateList';
import { HeartHandshake } from 'lucide-react';
import type { SavedDate } from './types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dates, setDates] = useState<SavedDate[]>([]);
  const [editingDate, setEditingDate] = useState<SavedDate | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar citas desde Firestore
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dates"));
        const datesData: SavedDate[] = [];
        querySnapshot.forEach((doc) => {
          datesData.push(doc.data() as SavedDate);
        });
        
        // Ordenar por fecha (las más recientes primero, o como prefieras)
        datesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setDates(datesData);
      } catch (error) {
        console.error("Error cargando citas de Firestore: ", error);
        alert("Hubo un error cargando el historial.");
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, []);

  const handleSaveDate = async (newDate: SavedDate) => {
    try {
      // Guardar o actualizar en Firestore
      await setDoc(doc(db, "dates", newDate.id), newDate);
      
      // Actualizar estado local
      setDates(prevDates => {
        const exists = prevDates.some(d => d.id === newDate.id);
        if (exists) {
          return prevDates.map(d => d.id === newDate.id ? newDate : d);
        }
        return [newDate, ...prevDates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    } catch (error) {
      console.error("Error guardando cita: ", error);
      alert("Hubo un error guardando la cita.");
    }
  };

  const handleDeleteDate = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      try {
        await deleteDoc(doc(db, "dates", id));
        setDates(prevDates => prevDates.filter(d => d.id !== id));
      } catch (error) {
        console.error("Error eliminando cita: ", error);
        alert("Hubo un error eliminando la cita.");
      }
    }
  };

  const handleEditDate = (date: SavedDate) => {
    setEditingDate(date);
    setIsModalOpen(true);
  };

  const handlePhotosUpdated = async (dateId: string, newPhotoUrl: string) => {
    try {
      const dateRef = doc(db, "dates", dateId);
      // Agregar la URL de la foto al array 'photos' en Firestore
      await updateDoc(dateRef, {
        photos: arrayUnion(newPhotoUrl)
      });
      
      // Actualizar estado local
      setDates(prevDates => prevDates.map(d => {
        if (d.id === dateId) {
          return { ...d, photos: [...(d.photos || []), newPhotoUrl] };
        }
        return d;
      }));
    } catch (error) {
      console.error("Error actualizando fotos: ", error);
      alert("Hubo un error al guardar la referencia de la foto.");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            <LoveNotes />
            <Countdown />
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
