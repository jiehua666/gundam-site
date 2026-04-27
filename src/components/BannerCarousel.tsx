"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  imageUrl: string;
  link: string;
  sortOrder: number;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const INTERVAL = 5000;

  const startProgressTimer = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / INTERVAL) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        if (progressRef.current) clearInterval(progressRef.current);
      }
    }, 50);
  }, []);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setProgress(100);
    startProgressTimer();
    setTimeout(() => setIsTransitioning(false), 500);
  }, [banners.length, isTransitioning, startProgressTimer]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(100);
    startProgressTimer();
    setTimeout(() => setIsTransitioning(false), 500);
  }, [banners.length, isTransitioning, startProgressTimer]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setProgress(100);
    startProgressTimer();
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentIndex, isTransitioning, startProgressTimer]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    startProgressTimer();
    timerRef.current = setInterval(() => {
      goToNext();
    }, INTERVAL);
  }, [goToNext, startProgressTimer]);

  useEffect(() => {
    if (banners.length <= 1) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [banners.length, resetTimer]);

  const handleDotClick = (index: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    goToSlide(index);
    resetTimer();
  };

  if (!banners) {
    return (
      <div className="glass-card neon-border rounded-xl overflow-hidden mt-10 md:mt-16">
        <div className="relative aspect-[21/9] md:aspect-[21/7] bg-gradient-to-br from-blue-500 to-purple-500">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-white">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="glass-card neon-border rounded-xl overflow-hidden mt-10 md:mt-16">
        <div className="relative aspect-[21/9] md:aspect-[21/7] bg-gradient-to-br from-primary/30 to-accent/30">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-primary/50">🎴 暂无Banner</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card neon-border rounded-xl overflow-hidden relative isolate mt-10 md:mt-16">
      <div className="relative aspect-[21/9] md:aspect-[21/7] overflow-hidden">
        {/* Slides */}
        <div className="relative w-full h-full" style={{ position: 'relative' }}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`transition-opacity duration-500 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: index === currentIndex ? 10 : 0 }}
            >
              <Link href={banner.link || "/"} className="block w-full h-full" style={{ position: 'relative' }}>
                <Image
                  src={banner.imageUrl}
                  alt={`Banner ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={index === 0}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Left Arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (timerRef.current) clearInterval(timerRef.current);
            setProgress(100);
            goToPrev();
            resetTimer();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center transition-all z-20"
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (timerRef.current) clearInterval(timerRef.current);
            setProgress(100);
            goToNext();
            resetTimer();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center transition-all z-20"
          aria-label="Next banner"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Progress Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className="relative h-2 rounded-full overflow-hidden bg-white/30 transition-all"
                style={{ width: isActive ? "32px" : "12px" }}
                aria-label={`Go to banner ${index + 1}`}
              >
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-white rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                )}
                {!isActive && <div className="w-full h-full bg-white/50 rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium z-20">
          {currentIndex + 1} / {banners.length}
        </div>
      </div>
    </div>
  );
}