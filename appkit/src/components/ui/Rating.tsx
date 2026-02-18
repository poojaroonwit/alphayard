"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
}

export const Rating = ({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 20,
  className,
  activeColor = "text-amber-400",
  inactiveColor = "text-slate-300 dark:text-slate-700",
}: RatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= displayValue;

        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={cn(
              "transition-all duration-200 transform",
              !readOnly && "hover:scale-125 focus:outline-none active:scale-90",
              readOnly ? "cursor-default" : "cursor-pointer"
            )}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors duration-200",
                isActive ? activeColor : inactiveColor,
                isActive ? "fill-current" : "fill-none"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
