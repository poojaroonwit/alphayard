"use client";

import React, { useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatisticRollProps {
  value: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

export const StatisticRoll = ({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1000,
  className,
  trend,
}: StatisticRollProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);
      
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const nextValue = countRef.current + (value - countRef.current) * easedProgress;
      
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        countRef.current = value;
        startTimeRef.current = null;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      startTimeRef.current = null;
    };
  }, [value, duration]);

  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-slate-400",
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1">
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-xl font-bold text-slate-400 dark:text-slate-500">
            {prefix}
          </span>
        )}
        <span className={cn(
          "text-3xl font-black tabular-nums tracking-tight transition-colors duration-500",
          trend && trendColors[trend],
          !trend && "text-slate-900 dark:text-white"
        )}>
          {displayValue.toFixed(decimals)}
        </span>
        {suffix && (
          <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};
