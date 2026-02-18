"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: "primary" | "success" | "danger" | "warning" | "indigo";
  children?: React.ReactNode;
}

export const ProgressRing = ({
  progress,
  size = 64,
  strokeWidth = 6,
  className,
  variant = "primary",
  children,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const variantClasses = {
    primary: "text-blue-600",
    success: "text-green-500",
    danger: "text-red-500",
    warning: "text-amber-500",
    indigo: "text-indigo-600",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={cn("transition-all duration-500 ease-out", variantClasses[variant])}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {children && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
};
