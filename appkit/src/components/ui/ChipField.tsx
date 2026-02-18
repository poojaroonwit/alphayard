"use client";

import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChipFieldProps {
  label?: string;
  placeholder?: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  className?: string;
  variant?: "primary" | "slate" | "indigo";
}

export const ChipField = ({
  label,
  placeholder = "Add tag...",
  chips,
  onChange,
  className,
  variant = "primary",
}: ChipFieldProps) => {
  const [inputValue, setInputValue] = useState("");

  const activeColors = {
    primary: "bg-black dark:bg-gray-800 text-white",
    slate: "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
    indigo: "bg-indigo-600 dark:bg-indigo-500 text-white",
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!chips.includes(inputValue.trim())) {
        onChange([...chips, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  const removeChip = (chipToRemove: string) => {
    onChange(chips.filter((chip) => chip !== chipToRemove));
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {label && (
        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[48px] focus-within:ring-2 focus-within:ring-blue-500/20 shadow-sm transition-all overflow-hidden">
        {chips.map((chip, index) => (
          <span
            key={`${chip}-${index}`}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold animate-in zoom-in-95 duration-200",
              activeColors[variant]
            )}
          >
            {chip}
            <button
              onClick={() => removeChip(chip)}
              className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white min-w-[100px] py-1"
        />
      </div>
    </div>
  );
};
