"use client";

import React, { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  className?: string;
}

export const SkeletonWrapper = ({
  isLoading,
  children,
  skeleton,
  className,
}: SkeletonWrapperProps) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Shimmer Effect overlay */}
      <div className="absolute inset-0 z-10 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-slate-800/10" style={{ backgroundSize: '200% 100%' }} />
      
      {skeleton ? (
        <div className="opacity-0">{children}</div> // Keep layout space
      ) : null}
      
      <div className={cn(
        "transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0"
      )}>
        {skeleton || children}
      </div>
    </div>
  );
};

export const Skeleton = ({
  className,
  shape = "rect",
}: {
  className?: string;
  shape?: "rect" | "circle";
}) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        className
      )}
    />
  );
};
