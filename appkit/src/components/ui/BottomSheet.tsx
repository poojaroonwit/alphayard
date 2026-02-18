"use client";

import React, { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
}: BottomSheetProps) => {
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
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:p-0">
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
                  "relative w-full transform overflow-hidden rounded-t-3xl bg-white dark:bg-slate-900 px-4 pb-8 pt-5 text-left shadow-2xl transition-all sm:max-w-lg sm:px-6",
                  className
                )}
              >
                {/* Drag Handle Indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                  <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    {title && (
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-slate-900 dark:text-white"
                      >
                        {title}
                      </Dialog.Title>
                    )}
                    {showCloseButton && (
                      <button
                        type="button"
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800 focus:outline-none"
                        onClick={onClose}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto scrollbar-hide">
                    {children}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
