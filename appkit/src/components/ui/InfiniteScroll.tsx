"use client";

import React, { useEffect, useRef } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  threshold?: number;
  loader?: React.ReactNode;
}

export const InfiniteScroll = ({
  onLoadMore,
  hasMore,
  isLoading,
  className,
  threshold = 0.5,
  loader = <LoadingSpinner />,
}: InfiniteScrollProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div className={cn("w-full py-6 flex justify-center", className)} ref={observerTarget}>
      {isLoading && loader}
      {!hasMore && !isLoading && (
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">End of results</span>
      )}
    </div>
  );
};
