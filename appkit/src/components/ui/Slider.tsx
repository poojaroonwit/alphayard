"use client";

import React, { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: "primary" | "indigo" | "success" | "warning";
  label?: string;
}

export const Slider = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
  variant = "primary",
  label,
}: SliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const variantStyles = {
    primary: "bg-blue-600",
    indigo: "bg-indigo-600",
    success: "bg-green-500",
    warning: "bg-amber-500",
  };

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const rawValue = percent * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("w-full py-4", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
        </div>
      )}
      <div 
        ref={trackRef}
        className="relative h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer touch-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div 
          className={cn("absolute h-full rounded-full transition-all duration-150", variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
        <div 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 bg-white dark:bg-slate-900 border-2 rounded-full shadow-lg transition-transform duration-150",
            isDragging ? "scale-125 border-slate-900 dark:border-white" : "scale-100 border-slate-200 dark:border-slate-800",
            percentage === 0 && "translate-x-0 ml-1"
          )}
          style={{ left: `${percentage}%` }}
        >
          {isDragging && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg">
              {value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
