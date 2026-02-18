"use client";

import React, { Fragment, ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
  hideHeader?: boolean;
  noPadding?: boolean;
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  className,
  hideHeader = false,
  noPadding = false,
}: DrawerProps) => {
  const isRight = side === "right";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className={cn(
              "pointer-events-none fixed inset-y-0 flex max-w-full p-4",
              isRight ? "right-0 pl-14" : "left-0 pr-14"
            )}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom={isRight ? "translate-x-full" : "-translate-x-full"}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo={isRight ? "translate-x-full" : "-translate-x-full"}
              >
                <Dialog.Panel className={cn("pointer-events-auto w-screen max-w-md h-full", className)}>
                  <div className="flex h-full flex-col bg-white dark:bg-slate-950 shadow-2xl rounded-3xl border border-gray-100/50 overflow-hidden">
                    {!hideHeader && (
                      <div className="px-6 py-6 sm:px-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {title}
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-full bg-slate-100 dark:bg-slate-900 p-1.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                              onClick={onClose}
                            >
                              <span className="absolute -inset-0.5" />
                              <span className="sr-only">Close panel</span>
                              <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={cn(
                      "relative flex-1 flex flex-col min-h-0 min-w-0", 
                      !noPadding && "px-6 py-6 sm:px-6"
                    )}>
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
