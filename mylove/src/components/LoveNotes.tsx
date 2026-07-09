import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const NOTES = [
  "Me haces la persona más feliz del mundo.",
  "Amo tu sonrisa, ilumina mis días.",
  "Eres mi lugar favorito en el mundo.",
  "Gracias por ser mi compañero/a de aventuras.",
  "Cada momento a tu lado es un tesoro.",
  "Me encanta cómo me haces sentir cuando estoy contigo.",
  "Eres la mejor casualidad de mi vida.",
  "No hay nadie más con quien prefiera estar.",
  "Haces que los días grises se llenen de color.",
  "Te amo más hoy que ayer, pero menos que mañana."
];

export default function LoveNotes() {
  const [note, setNote] = useState("");

  useEffect(() => {
    // Escoger una nota al azar al cargar
    setNote(NOTES[Math.floor(Math.random() * NOTES.length)]);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-300 to-purple-400"></div>
      
      <Heart className="mx-auto text-pink-500 w-8 h-8 mb-3 animate-pulse" fill="currentColor" />
      
      <p className="text-gray-800 text-lg font-medium font-cursive text-3xl leading-relaxed">
        "{note}"
      </p>
      
      <button 
        onClick={() => setNote(NOTES[Math.floor(Math.random() * NOTES.length)])}
        className="mt-4 text-xs text-purple-600 hover:text-purple-800 underline opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        Leer otra nota
      </button>
    </div>
  );
}
