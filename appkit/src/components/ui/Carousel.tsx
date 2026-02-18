"use client";

import React, { ReactNode, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CarouselProps {
  children: ReactNode[];
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  autoPlay?: boolean;
  interval?: number;
}

export const Carousel = ({
  children,
  className,
  showArrows = true,
  showDots = true,
  autoPlay = false,
  interval = 5000,
}: CarouselProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemWidth = container.offsetWidth;
    container.scrollTo({
      left: itemWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  const next = () => {
    const nextIndex = (activeIndex + 1) % children.length;
    scrollToIndex(nextIndex);
  };

  const prev = () => {
    const prevIndex = (activeIndex - 1 + children.length) % children.length;
    scrollToIndex(prevIndex);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, activeIndex, interval]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const index = Math.round(container.scrollLeft / container.offsetWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <div className={cn("relative group w-full", className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0 snap-center">
            {child}
          </div>
        ))}
      </div>

      {showArrows && children.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && children.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                activeIndex === index ? "w-6 bg-blue-600 dark:bg-blue-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
