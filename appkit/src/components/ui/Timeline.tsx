"use client";

import React, { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineItemProps {
  title: string;
  time: string;
  description?: ReactNode;
  icon?: ReactNode;
  isLast?: boolean;
  status?: "default" | "success" | "warning" | "danger" | "info";
}

export const TimelineItem = ({
  title,
  time,
  description,
  icon,
  isLast,
  status = "default",
}: TimelineItemProps) => {
  const statusColors = {
    default: "bg-slate-200 dark:bg-slate-700 text-slate-500",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600",
    warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-600",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-600",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
  };

  const dotColors = {
    default: "bg-slate-400 dark:bg-slate-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
      )}
      
      <div className={cn(
        "absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110",
        icon ? statusColors[status] : dotColors[status]
      )}>
        {icon ? (
          <div className="h-3.5 w-3.5">{icon}</div>
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            {title}
          </h4>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {time}
          </span>
        </div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

export const Timeline = ({ children, className }: TimelineProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      {children}
    </div>
  );
};
