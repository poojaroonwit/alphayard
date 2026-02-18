"use client";

import React, { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    isUp: boolean;
  };
  sparkle?: boolean;
  className?: string;
  variant?: "primary" | "indigo" | "success" | "warning";
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparkle = false,
  className,
  variant = "primary",
}: MetricCardProps) => {
  const variantStyles = {
    primary: "from-blue-500/10 to-transparent border-blue-200/50 dark:border-blue-800/20",
    indigo: "from-indigo-500/10 to-transparent border-indigo-200/50 dark:border-indigo-800/20",
    success: "from-green-500/10 to-transparent border-green-200/50 dark:border-green-800/20",
    warning: "from-amber-500/10 to-transparent border-amber-200/50 dark:border-amber-800/20",
  };

  const trendColors = {
    up: "text-green-500 dark:text-green-400",
    down: "text-red-500 dark:text-red-400",
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border bg-white dark:bg-slate-900/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md group",
      "bg-gradient-to-br",
      variantStyles[variant],
      className
    )}>
      {sparkle && (
        <div className="absolute top-2 right-2 text-amber-400/30 group-hover:text-amber-400 transition-colors animate-pulse">
          <Sparkles size={16} />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
        </div>
        {icon && (
          <div className={cn(
            "p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300"
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={cn("text-xs font-bold flex items-center gap-1", trend.isUp ? trendColors.up : trendColors.down)}>
            {trend.isUp ? "+" : ""}{trend.value}
          </div>
        )}
      </div>
    </div>
  );
};
