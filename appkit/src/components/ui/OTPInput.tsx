"use client";

import React, { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  className?: string;
  disabled?: boolean;
}

export const OTPInput = ({
  length = 6,
  onComplete,
  className,
  disabled = false,
}: OTPInputProps) => {
  const [values, setValues] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    
    // Only allow numbers
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newValues = [...values];
    newValues[index] = char;
    setValues(newValues);

    // Auto focus next
    if (char && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const code = newValues.join("");
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace" && !values[index] && index > 0) {
      // Focus previous on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = [...values];
    pastedData.split("").forEach((char, i) => {
      if (i < length) newValues[i] = char;
    });
    setValues(newValues);

    // Trigger completion if pasted full length
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
    
    // Focus last filled or next empty
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={cn("flex space-x-2", className)}>
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 bg-white text-center text-xl font-bold transition-all focus:outline-none dark:bg-slate-900 dark:text-white",
            value
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-slate-200 focus:border-blue-500 dark:border-slate-700"
          )}
        />
      ))}
    </div>
  );
};
