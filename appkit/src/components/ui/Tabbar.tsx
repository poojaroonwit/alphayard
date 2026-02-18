"use client";

import React, { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabbarItem {
  id: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
}

interface TabbarProps {
  tabs: TabbarItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "primary" | "slate" | "indigo";
}

export const Tabbar = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "primary",
}: TabbarProps) => {
  const activeColors = {
    primary: "text-blue-600 dark:text-blue-400",
    slate: "text-slate-900 dark:text-white",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  const indicatorColors = {
    primary: "bg-blue-600 dark:bg-blue-400",
    slate: "bg-slate-900 dark:bg-white",
    indigo: "bg-indigo-600 dark:bg-indigo-400",
  };

  return (
    <div className={cn(
      "fixed bottom-0 inset-x-0 z-40 lg:hidden px-4 pb-safe-offset-2",
      className
    )}>
      <div className="flex h-16 w-full items-center justify-around rounded-2xl border border-slate-200 bg-white/80 px-2 py-1 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex h-full flex-1 flex-col items-center justify-center space-y-1 transition-all",
                isActive ? activeColors[variant] : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                isActive ? "scale-110" : "scale-100"
              )}>
                {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {tab.label}
              </span>
              
              {isActive && (
                <div 
                  className={cn(
                    "absolute -bottom-1 h-1 w-6 rounded-full",
                    indicatorColors[variant]
                  )}
                  style={{ transform: "translateY(50%)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
