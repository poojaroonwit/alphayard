"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AvatarItem {
  src?: string;
  name: string;
}

interface AvatarGroupProps {
  avatars: AvatarItem[];
  limit?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  borderVariant?: "white" | "slate";
}

export const AvatarGroup = ({
  avatars,
  limit = 4,
  size = "md",
  className,
  borderVariant = "white",
}: AvatarGroupProps) => {
  const displayedAvatars = avatars.slice(0, limit);
  const excess = avatars.length - limit;

  const sizeClasses = {
    xs: "h-6 w-6 text-[8px]",
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-[xs]",
    lg: "h-12 w-12 text-sm",
  };

  const borderClasses = {
    white: "ring-2 ring-white dark:ring-slate-950",
    slate: "ring-2 ring-slate-100 dark:ring-slate-800",
  };

  const spacingClasses = {
    xs: "-space-x-1.5",
    sm: "-space-x-2",
    md: "-space-x-3",
    lg: "-space-x-4",
  };

  return (
    <div className={cn("flex flex-row-reverse justify-end items-center", spacingClasses[size], className)}>
      {excess > 0 && (
        <div 
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400 z-0",
            sizeClasses[size],
            borderClasses[borderVariant]
          )}
        >
          +{excess}
        </div>
      )}
      
      {displayedAvatars.reverse().map((avatar, index) => (
        <div
          key={`${avatar.name}-${index}`}
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden group transition-all duration-300 hover:z-30 hover:-translate-y-1 cursor-default",
            sizeClasses[size],
            borderClasses[borderVariant]
          )}
          title={avatar.name}
        >
          {avatar.src ? (
            <img 
              src={avatar.src} 
              alt={avatar.name} 
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-bold text-slate-600 dark:text-slate-300 uppercase">
              {avatar.name.charAt(0)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
