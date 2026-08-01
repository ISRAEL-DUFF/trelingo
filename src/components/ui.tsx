import type { ReactNode } from "react";
import { useEffect } from "react";

export function TopBar({
  left,
  right,
  progress,
}: {
  left?: ReactNode;
  right?: ReactNode;
  progress?: number;
}) {
  return (
    <div className="topbar">
      <div className="topbar__stat">{left}</div>
      {progress !== undefined && (
        <div className="progressbar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="progressbar__fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
      <div className="topbar__stat">{right}</div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  block,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  block?: boolean;
}) {
  return (
    <button
      type="button"
      {...rest}
      className={`btn btn--${variant}${block ? " btn--block" : ""} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  // Escape closes, and body scroll locks while open — otherwise the page behind
  // scrolls under the sheet on touch devices.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        {children}
      </div>
    </div>
  );
}

export function Banner({
  kind = "info",
  children,
}: {
  kind?: "info" | "warn" | "error" | "success";
  children: ReactNode;
}) {
  return (
    <div className={`banner banner--${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function Empty({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <div className="h3 title">{title}</div>
      {hint && <p className="small muted">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="empty">
      <div className="spinner" style={{ margin: "0 auto" }} />
      <p className="small muted" style={{ marginTop: 12 }}>
        {label}
      </p>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="switch-row">
      <span>
        <span style={{ display: "block" }}>{label}</span>
        {hint && <span className="small muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 22, height: 22, accentColor: "var(--gold)" }}
      />
    </label>
  );
}
