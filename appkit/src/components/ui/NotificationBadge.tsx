"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationBadgeProps {
  count?: number;
  max?: number;
  className?: string;
  variant?: "danger" | "warning" | "success" | "primary" | "indigo";
  ping?: boolean;
  children?: React.ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const NotificationBadge = ({
  count,
  max = 99,
  className,
  variant = "danger",
  ping = false,
  children,
  position = "top-right",
}: NotificationBadgeProps) => {
  const displayCount = count && count > max ? `${max}+` : count;

  const variantClasses = {
    danger: "bg-red-500",
    warning: "bg-amber-500",
    success: "bg-green-500",
    primary: "bg-blue-600",
    indigo: "bg-indigo-600",
  };

  const positionClasses = {
    "top-right": "-top-1 -right-1",
    "top-left": "-top-1 -left-1",
    "bottom-right": "-bottom-1 -right-1",
    "bottom-left": "-bottom-1 -left-1",
  };

  const isDot = count === undefined;

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      <span className={cn(
        "absolute flex items-center justify-center rounded-full text-white font-bold ring-2 ring-white dark:ring-slate-950",
        variantClasses[variant],
        positionClasses[position],
        isDot ? "h-2 w-2" : "h-5 min-w-[20px] px-1 text-[10px]",
        "animate-in zoom-in duration-300"
      )}>
        {ping && (
          <span className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-75",
            variantClasses[variant]
          )} />
        )}
        {!isDot && displayCount}
      </span>
    </div>
  );
};
