"use client";

import { useEffect, useRef, useState } from "react";

export function GuideModal({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      triggerButtonRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        className={className}
        ref={triggerButtonRef}
        type="button"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      {open && (
        <div
          className="guide-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            aria-label="Exemple de guide MyStay"
            aria-modal="true"
            className="guide-modal-panel"
            role="dialog"
          >
            <button
              aria-label="Fermer le guide"
              className="guide-modal-close"
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <iframe
              className="guide-modal-frame"
              src="/guide-exemple"
              title="Guide MyStay pour les voyageurs"
            />
          </section>
        </div>
      )}
    </>
  );
}
