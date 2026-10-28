'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Counts up to `to` once the element scrolls into view. Mirrors the
 * animated stat figures used on the landing page.
 */
export function CountUp({
  to,
  duration = 1500,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const run = () => {
      if (started.current) return;
      started.current = true;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(to);
        return;
      }

      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // easeOutExpo — fast start, gentle settle.
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(Math.round(eased * to));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
