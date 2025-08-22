'use client';

import React, { useState, useEffect } from 'react';

interface WeddingCountdownProps {
  weddingDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function WeddingCountdown({ weddingDate, className = '' }: WeddingCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date().getTime();
      const wedding = new Date(weddingDate).getTime();
      const difference = wedding - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Set initial value
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [weddingDate, mounted]);

  if (!mounted) {
    // Return a placeholder during SSR to avoid hydration mismatch
    return (
      <div className={className}>
        <div className="rounded-2xl shadow-xl border-0 text-white" style={{ background: 'linear-gradient(135deg, #722F37 0%, #5A252A 100%)' }}>
          <div className="p-6 text-center">
            <div className="block mb-2 opacity-90 tracking-[0.2em] text-xs font-semibold">COUNTDOWN TO YOUR SPECIAL DAY</div>
            <div className="flex justify-center gap-3 mb-2">
              {['DAYS','HOURS','MINUTES','SECONDS'].map((label) => (
                <div key={label} className="text-center">
                  <div className="font-[\"Bodoni Moda\",serif] text-2xl sm:text-3xl font-light leading-none mb-1">--</div>
                  <div className="text-[0.625rem] tracking-[0.1em] font-semibold opacity-80">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className={className}>
      <div className="rounded-2xl shadow-2xl border-0 text-white transition-all" style={{ background: 'linear-gradient(135deg, #722F37 0%, #5A252A 100%)' }}>
        <div className="p-6 text-center">
          <div className="block mb-2 opacity-90 tracking-[0.2em] text-xs font-semibold">COUNTDOWN TO YOUR SPECIAL DAY</div>
          <div className="flex justify-center gap-2 sm:gap-3 mb-2">
            {timeUnits.map((unit) => (
              <div key={unit.label} className="text-center">
                <div className="font-[\"Bodoni Moda\",serif] text-xl sm:text-2xl md:text-3xl font-light leading-none mb-1" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }}>
                  {unit.value.toString().padStart(2, '0')}
                </div>
                <div className="text-[0.625rem] tracking-[0.1em] font-semibold opacity-80">{unit.label}</div>
              </div>
            ))}
          </div>
          {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
            <div className="font-[\"Bodoni Moda\",serif] text-base sm:text-lg opacity-90 mt-1">🎉 Your Wedding Day is Here! 🎉</div>
          ) : (
            <div className="opacity-80 italic mt-1 text-sm">Every moment brings you closer to forever</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeddingCountdown;