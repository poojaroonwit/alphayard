"use client";

import React from "react";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: string;
}

export const Accordion = ({ items, className, defaultOpen }: AccordionProps) => {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {items.map((item) => (
        <Disclosure key={item.id} defaultOpen={item.id === defaultOpen}>
          {({ open }) => (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-all duration-300">
              <Disclosure.Button className="flex w-full justify-between items-center px-5 py-4 text-left text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span>{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-slate-400 transition-transform duration-300",
                    open && "rotate-180"
                  )}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="px-5 pb-4 pt-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.content}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  );
};
