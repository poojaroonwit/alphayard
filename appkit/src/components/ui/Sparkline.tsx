"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export const Sparkline = ({
  data,
  width = 100,
  height = 40,
  className,
  color = "currentColor",
  strokeWidth = 2,
  fill = false,
}: SparklineProps) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * stepX;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;
  const fillPathData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <div className={cn("inline-block", className)} style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {fill && (
          <path
            d={fillPathData}
            fill={color}
            fillOpacity={0.1}
            className="transition-all duration-500 ease-in-out"
          />
        )}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
    </div>
  );
};
