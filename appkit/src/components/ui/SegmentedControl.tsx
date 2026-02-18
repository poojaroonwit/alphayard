"use client";

import React, { useRef, useEffect, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SegmentOption<T extends string | number | boolean = string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number | boolean = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  variant?: "primary" | "slate";
}

export const SegmentedControl = <T extends string | number | boolean = string>({
  options,
  value,
  onChange,
  className,
  variant = "primary",
}: SegmentedControlProps<T>) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = options.findIndex((opt) => opt.value === value);
    const activeElement = optionsRef.current[activeIndex];

    if (activeElement && containerRef.current) {
      const { offsetLeft, offsetWidth } = activeElement;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex w-full items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
        className
      )}
    >
      {/* Animated Indicator */}
      <div
        className={cn(
          "absolute inset-y-1 left-0 z-0 rounded-lg shadow-sm transition-all duration-300 ease-in-out",
          variant === "primary" ? "bg-white dark:bg-slate-700" : "bg-white dark:bg-slate-900"
        )}
        style={indicatorStyle}
      />

      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={(el) => {
            optionsRef.current[index] = el;
          }}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center py-2 text-sm font-medium transition-colors",
            value === option.value
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {option.icon && <span className="mr-2 h-4 w-4">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
};
