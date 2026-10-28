'use client';

import React, { CSSProperties, ReactNode, useEffect, useState } from 'react';

interface PieChartProps {
  percentage: number;
  label: string;
  size: number;
  color?: string;
  remainderColor?: string;
  donut?: boolean;
  children?: ReactNode;
  className?: string;
}

/** Accessible animated pie/donut used for event and certificate progress summaries. */
export function PieChart({
  percentage,
  label,
  size,
  color = 'var(--accent)',
  remainderColor = 'var(--line)',
  donut = false,
  children,
  className = '',
}: PieChartProps) {
  const target = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    // Defer the target until after paint so the CSS custom property animates from an empty chart.
    const frame = window.requestAnimationFrame(() => {
      setAnimatedPercentage(target);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  const chartStyle = {
    width: size,
    height: size,
    '--pie-progress': `${animatedPercentage * 3.6}deg`,
    '--pie-color': color,
    '--pie-remainder': remainderColor,
  } as CSSProperties;

  return (
    <div
      role="img"
      aria-label={label}
      className={`animated-pie relative grid shrink-0 place-items-center rounded-full ${className}`}
      style={chartStyle}
    >
      {donut && (
        <div className="absolute inset-[18%] grid place-content-center rounded-full bg-[var(--surface)] text-center">
          {children}
        </div>
      )}
      {!donut && children}
    </div>
  );
}
