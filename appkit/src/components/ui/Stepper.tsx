"use client";

import React from "react";
import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
  variant?: "primary" | "slate";
}

export const Stepper = ({
  steps,
  currentStep,
  orientation = "horizontal",
  className,
  variant = "primary",
}: StepperProps) => {
  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex",
        isVertical ? "flex-col space-y-4" : "w-full items-start justify-between space-x-4",
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={index}
            className={cn(
              "relative flex items-start",
              !isVertical && "flex-1 last:flex-none",
              isVertical && "w-full"
            )}
          >
            {/* Step Icon & Line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted
                    ? variant === "primary"
                      ? "border-black bg-black text-white"
                      : "border-slate-900 bg-slate-900 text-white"
                    : isActive
                    ? variant === "primary"
                      ? "border-black text-black"
                      : "border-slate-900 text-slate-900"
                    : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3px]" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "transition-all duration-300",
                    isVertical
                      ? "my-1 h-12 w-0.5"
                      : "absolute left-8 top-4 h-0.5 w-[calc(100%-2rem)]",
                    isCompleted
                      ? variant === "primary"
                        ? "bg-blue-600"
                        : "bg-slate-900"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className={cn("ml-3 text-left", !isVertical && "mt-0")}>
              <p
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isActive || isCompleted
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
