"use client";

import React, { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActionSheetOption {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "primary";
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  className?: string;
}

export const ActionSheet = ({
  isOpen,
  onClose,
  title,
  options,
  cancelLabel = "Cancel",
  className,
}: ActionSheetProps) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300 sm:duration-500"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="transform transition ease-in duration-200 sm:duration-400"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel
                className={cn(
                  "relative w-full transform overflow-hidden transition-all sm:max-w-lg",
                  className
                )}
              >
                {/* Main Options Group */}
                <div className="overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
                  {title && (
                    <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {title}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col">
                    {options.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          option.onClick();
                          onClose();
                        }}
                        className={cn(
                          "flex w-full items-center justify-center px-4 py-4 text-lg font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                          index !== options.length - 1 && "border-b border-slate-200/50 dark:border-slate-800/50",
                          option.variant === "danger"
                            ? "text-red-500"
                            : option.variant === "primary"
                            ? "text-blue-500"
                            : "text-slate-900 dark:text-white"
                        )}
                      >
                        {option.icon && <span className="mr-3">{option.icon}</span>}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cancel Button Group */}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 flex w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 px-4 py-4 text-lg font-semibold text-blue-500 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {cancelLabel}
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
