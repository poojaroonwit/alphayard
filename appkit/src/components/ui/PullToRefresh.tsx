"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  pullThreshold?: number;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className,
  pullThreshold = 80,
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, pullThreshold + 20));
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto overflow-x-hidden scroll-smooth", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-transform duration-200"
        style={{
          height: `${pullThreshold}px`,
          top: `-${pullThreshold}px`,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        ) : (
          <div
            className="flex flex-col items-center justify-center transition-opacity"
            style={{ opacity: pullDistance / pullThreshold }}
          >
            <ArrowDown
              className={cn(
                "h-6 w-6 text-slate-400 transition-transform duration-200",
                pullDistance >= pullThreshold ? "rotate-180" : "rotate-0"
              )}
            />
          </div>
        )}
      </div>

      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};
