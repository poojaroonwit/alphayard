"use client";

import React, { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Search, X, ArrowLeft, History } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  recentSearches?: string[];
  placeholder?: string;
}

export const SearchOverlay = ({
  isOpen,
  onClose,
  onSearch,
  recentSearches = [],
  placeholder = "Search...",
}: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      onClose();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <div className="fixed inset-0 z-10 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel className="flex h-full w-full flex-col bg-slate-50 dark:bg-slate-950">
              {/* Header */}
              <div className="flex items-center space-x-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <form onSubmit={handleSearch} className="flex flex-1 items-center">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-xl border-none bg-slate-100 py-3 pl-10 pr-10 text-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!query && recentSearches.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recent Searches
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(item);
                            onSearch(item);
                            onClose();
                          }}
                          className="flex w-full items-center space-x-3 rounded-xl p-3 text-left transition-colors hover:bg-white dark:hover:bg-slate-900"
                        >
                          <History className="h-5 w-5 text-slate-400" />
                          <span className="flex-1 font-medium text-slate-700 dark:text-slate-200">
                            {item}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {query && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-slate-500">
                      Press <span className="font-bold">Enter</span> to search for "{query}"
                    </p>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
