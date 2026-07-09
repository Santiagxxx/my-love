import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (5 - targetDate.getDay() + 7) % 7 || 7); // Próximo viernes
    targetDate.setHours(20, 0, 0, 0);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 text-center shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-purple-900 flex items-center justify-center gap-2">
        <Clock className="text-purple-500 w-5 h-5" />
        Falta para nuestra cita
      </h3>
      
      <div className="flex justify-center gap-4">
        {[
          { label: 'Días', value: timeLeft.days },
          { label: 'Horas', value: timeLeft.hours },
          { label: 'Min', value: timeLeft.minutes },
          { label: 'Seg', value: timeLeft.seconds }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="bg-white/40 rounded-lg w-14 h-14 flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-sm">
              <span className="text-2xl font-bold text-pink-600">{item.value.toString().padStart(2, '0')}</span>
            </div>
            <span className="text-xs text-gray-600 mt-1 font-medium uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
