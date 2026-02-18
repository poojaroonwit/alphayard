"use client";

import React from "react";
import { Switch } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "success" | "danger" | "indigo";
}

export const ToggleSwitch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  variant = "primary",
}: ToggleSwitchProps) => {
  const activeColors = {
    primary: "bg-blue-600",
    success: "bg-green-500",
    danger: "bg-red-500",
    indigo: "bg-indigo-600",
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {(label || description) && (
        <div className="flex flex-col pr-4">
          {label && (
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? activeColors[variant] : "bg-slate-200 dark:bg-slate-800"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </Switch>
    </div>
  );
};
