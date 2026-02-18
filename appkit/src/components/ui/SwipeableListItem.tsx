"use client";

import React, { useState, useRef, ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SwipeAction {
  label: string;
  icon?: ReactNode;
  color: string;
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

export const SwipeableListItem = ({
  children,
  leftActions = [],
  rightActions = [],
  className,
}: SwipeableListItemProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const maxLeftSwipe = leftActions.length * 80;
  const maxRightSwipe = rightActions.length * 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX - swipeX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].pageX;
    let newX = currentX - startX.current;

    // Limit swipe distance
    if (newX > 0) {
      newX = Math.min(newX, maxLeftSwipe + 20);
    } else {
      newX = Math.max(newX, -(maxRightSwipe + 20));
    }

    setSwipeX(newX);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Snap to actions or center
    if (swipeX > maxLeftSwipe / 2) {
      setSwipeX(maxLeftSwipe);
    } else if (swipeX < -(maxRightSwipe / 2)) {
      setSwipeX(-maxRightSwipe);
    } else {
      setSwipeX(0);
    }
  };

  return (
    <div className={cn("relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800", className)}>
      {/* Left Actions */}
      <div className="absolute inset-y-0 left-0 flex h-full">
        {leftActions.map((action, i) => (
          <button
            key={`left-${i}`}
            onClick={() => {
              action.onClick();
              setSwipeX(0);
            }}
            className={cn(
              "flex w-20 flex-col items-center justify-center text-white transition-opacity",
              action.color
            )}
            style={{ 
              opacity: swipeX > (i * 80) ? 1 : 0,
              transform: `scale(${Math.min(1, swipeX / ((i + 1) * 80))})`
            }}
          >
            {action.icon && <span className="mb-1">{action.icon}</span>}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Right Actions */}
      <div className="absolute inset-y-0 right-0 flex h-full">
        {rightActions.map((action, i) => (
          <button
            key={`right-${i}`}
            onClick={() => {
              action.onClick();
              setSwipeX(0);
            }}
            className={cn(
              "flex w-20 flex-col items-center justify-center text-white transition-opacity",
              action.color
            )}
            style={{ 
              opacity: Math.abs(swipeX) > (i * 80) ? 1 : 0,
              transform: `scale(${Math.min(1, Math.abs(swipeX) / ((i + 1) * 80))})`
            }}
          >
            {action.icon && <span className="mb-1">{action.icon}</span>}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        ref={itemRef}
        className="relative z-10 bg-inherit transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => swipeX !== 0 && setSwipeX(0)}
      >
        {children}
      </div>
    </div>
  );
};
