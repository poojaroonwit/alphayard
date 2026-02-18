"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center" | "top-right" | "top-left";
  variant?: "primary" | "secondary" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
}

export const FloatingActionButton = ({
  icon,
  label,
  position = "bottom-right",
  variant = "primary",
  size = "md",
  className,
  ...props
}: FloatingActionButtonProps) => {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const variantClasses = {
    primary: "bg-black hover:bg-gray-800 text-white shadow-black/25",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-500/25",
    accent: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/25",
  };

  const sizeClasses = {
    sm: "p-2.5",
    md: "p-4",
    lg: "p-5",
  };

  return (
    <button
      type="button"
      className={cn(
        "fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        positionClasses[position],
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className={cn(size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5")}>
        {icon}
      </span>
      {label && (
        <span className="ml-2 whitespace-nowrap pr-1 text-sm font-medium">
          {label}
        </span>
      )}
    </button>
  );
};
