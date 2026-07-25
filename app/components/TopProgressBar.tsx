"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Complete progress when pathname or searchParams change
  useEffect(() => {
    if (!visible) return;

    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 200);

    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, [pathname, searchParams]);

  // Intercept link clicks to trigger progress bar start
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        target.target === "_blank"
      ) {
        return;
      }

      const targetUrl = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);

      // Only trigger if navigating to a different pathname/search
      if (
        targetUrl.origin === currentUrl.origin &&
        (targetUrl.pathname !== currentUrl.pathname ||
          targetUrl.search !== currentUrl.search)
      ) {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (finishTimerRef.current) clearTimeout(finishTimerRef.current);

        setVisible(true);
        setProgress(30);

        timerRef.current = setTimeout(() => {
          setProgress(70);
        }, 150);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => {
      document.removeEventListener("click", handleLinkClick);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[100] pointer-events-none transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        backgroundColor: "#6366f1", // Solid Indigo 500 (No gradients)
        boxShadow: "0 0 10px rgba(99, 102, 241, 0.7)",
      }}
    />
  );
}
