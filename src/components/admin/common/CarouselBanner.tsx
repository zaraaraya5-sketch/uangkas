import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  id: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueSubtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  accentBg?: string;
  details?: Array<{ label: string; value: string; color?: string }>;
}

interface CarouselBannerProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
}

export const CarouselBanner: React.FC<CarouselBannerProps> = ({
  slides,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [slides.length, isHovered, autoPlayInterval]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-soft-xl border border-slate-700/50 transition-all"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      {/* Main Slide Content */}
      <div className="relative z-10 p-6 sm:p-7 min-h-[160px] flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {currentSlide.badge && (
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    currentSlide.badgeColor || 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentSlide.badge}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                Slide {currentIndex + 1} dari {slides.length}
              </span>
            </div>

            <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              {Icon && (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    currentSlide.iconBg || 'bg-white/10'
                  } ${currentSlide.iconColor || 'text-emerald-400'}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span>{currentSlide.title}</span>
            </h4>

            {currentSlide.subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Right Value Box & Details */}
          {(currentSlide.value || (currentSlide.details && currentSlide.details.length > 0)) && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col justify-center min-w-[220px] shrink-0">
              {currentSlide.value && (
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight block">
                    {currentSlide.value}
                  </span>
                  {currentSlide.valueSubtitle && (
                    <span className="text-[11px] text-slate-300 font-medium mt-0.5 block">
                      {currentSlide.valueSubtitle}
                    </span>
                  )}
                </div>
              )}

              {currentSlide.details && currentSlide.details.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/10 text-xs">
                  {currentSlide.details.map((d, i) => (
                    <div key={i}>
                      <span className="text-[10px] text-slate-400 block">{d.label}</span>
                      <span className={`font-bold ${d.color || 'text-white'}`}>{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Dots & Arrows */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-7 bg-emerald-400'
                    : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
                title={`Pindah ke slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              title="Slide Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              title="Slide Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
