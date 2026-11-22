"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FloatingDropdownMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  menuWidthPx: number;
  widthClass: string;
  children: React.ReactNode;
}

export function useFloatingDropdown(menuWidthPx: number) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const computeCoords = useCallback(() => {
    const el = anchorRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const clampedLeft = Math.max(
      12,
      Math.min(rect.right - menuWidthPx, window.innerWidth - menuWidthPx - 12),
    );
    setCoords({
      top: rect.bottom + 6,
      left: clampedLeft,
    });
  }, [menuWidthPx]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) computeCoords();
      return next;
    });
  }, [computeCoords]);

  const close = useCallback(() => setOpen(false), []);

  return { open, anchorRef, coords, computeCoords, toggle, close };
}

export default function FloatingDropdownMenu({
  open,
  onClose,
  anchorRef,
  coords,
  onReposition,
  widthClass,
  children,
}: Omit<FloatingDropdownMenuProps, "menuWidthPx"> & {
  coords: { top: number; left: number };
  onReposition: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, onClose, anchorRef, onReposition]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: coords.top, left: coords.left }}
      className={`fixed ${widthClass} bg-highlight border border-line rounded-2xl shadow-[0_16px_40px_rgba(28,28,31,0.12)] z-[9999] overflow-hidden py-1.5 animate-scale-in`}
    >
      {children}
    </div>,
    document.body,
  );
}

