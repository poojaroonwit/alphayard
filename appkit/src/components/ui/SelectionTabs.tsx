"use client";

import React, { ReactNode, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectionTabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SelectionTabsProps {
  tabs: SelectionTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  fit?: boolean;
  // Style config props to match mobile component flexibility
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  activeIconColor?: string;
  inactiveIconColor?: string;
  menuBackgroundColor?: string;
  borderRadius?: number;
  menuShowShadow?: string | boolean;
  activeShowShadow?: string | boolean;
  inactiveShowShadow?: string | boolean;
}

const getShadowClass = (shadow: string | boolean | undefined) => {
    if (shadow === true) return "shadow-lg";
    switch (shadow) {
        case 'sm': return "shadow-sm";
        case 'md': return "shadow-md";
        case 'lg': return "shadow-xl";
        default: return "";
    }
};

export const SelectionTabs = ({
  tabs,
  activeTab,
  onChange,
  className,
  fit = false,
  activeColor = "#FA7272",
  inactiveColor = "#F3F4F6",
  activeTextColor = "#FA7272",
  inactiveTextColor = "#6B7280",
  activeIconColor = "#FFFFFF",
  inactiveIconColor = "#6B7280",
  menuBackgroundColor = "transparent",
  borderRadius = 12,
  menuShowShadow = 'none',
  activeShowShadow = 'none',
  inactiveShowShadow = 'none',
}: SelectionTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const shadowClass = getShadowClass(menuShowShadow);

  useEffect(() => {
    if (!fit && activeTabRef.current && containerRef.current) {
        // Simple scroll into view logic
        activeTabRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
  }, [activeTab, fit]);

  return (
    <div 
        ref={containerRef}
        className={cn(
            "w-full no-scrollbar relative transition-all duration-300",
            !fit && "overflow-x-auto",
            shadowClass,
            !!shadowClass && "z-10",
            className
        )}
        style={{ backgroundColor: menuBackgroundColor }}
    >
      <div className={cn(
          "flex items-center",
          fit ? "justify-between" : "gap-6 px-1"
      )}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              onClick={() => onChange(tab.id)}
              className={cn(
                "group flex flex-col items-center justify-center gap-1 transition-all outline-none",
                // fit && "flex-1" // Removed to allow space-between to push items to edges
              )}
            >
              <div 
                className={cn(
                  "flex h-12 w-12 items-center justify-center transition-all duration-300",
                  isActive ? "scale-105" : "hover:bg-gray-200 dark:hover:bg-slate-700",
                  isActive ? getShadowClass(activeShowShadow) : getShadowClass(inactiveShowShadow)
                )}
                style={{
                    backgroundColor: isActive ? activeColor : inactiveColor,
                    color: isActive ? activeIconColor : inactiveIconColor,
                    borderRadius: borderRadius
                }}
              >
                {tab.icon}
              </div>
              <span 
                className="text-[11px] font-semibold transition-colors duration-200"
                style={{
                    color: isActive ? activeTextColor : inactiveTextColor
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
