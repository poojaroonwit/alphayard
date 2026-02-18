"use client";

import React, { ReactNode } from "react";
import { Menu, Transition } from "@headlessui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FloatingMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
}

interface FloatingMenuProps {
  trigger: ReactNode;
  items: FloatingMenuItem[];
  className?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const FloatingMenu = ({
  trigger,
  items,
  className,
  position = "top-right",
}: FloatingMenuProps) => {
  const positionClasses = {
    "top-right": "origin-top-right right-0 mt-2",
    "top-left": "origin-top-left left-0 mt-2",
    "bottom-right": "origin-bottom-right right-0 bottom-full mb-2",
    "bottom-left": "origin-bottom-left left-0 bottom-full mb-2",
  };

  const itemVariantClasses = {
    default: "text-slate-700 dark:text-slate-300",
    danger: "text-red-500 dark:text-red-400",
    success: "text-green-500 dark:text-green-400",
  };

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button as={React.Fragment}>
            {trigger}
          </Menu.Button>
        </div>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-90"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-90"
        >
          <Menu.Items className={cn(
            "absolute z-50 w-48 rounded-2xl bg-white/90 dark:bg-slate-900/90 shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl focus:outline-none overflow-hidden",
            positionClasses[position]
          )}>
            <div className="py-1">
              {items.map((item) => (
                <Menu.Item key={item.id}>
                  {({ active }) => (
                    <button
                      onClick={item.onClick}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-sm font-bold transition-all",
                        active ? "bg-slate-50 dark:bg-slate-800/50" : "transparent",
                        itemVariantClasses[item.variant || "default"]
                      )}
                    >
                      {item.icon && <span className="opacity-70">{item.icon}</span>}
                      {item.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};
