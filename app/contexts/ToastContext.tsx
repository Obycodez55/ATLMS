"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const TOAST_COLORS: Record<ToastType, string> = {
  success: "#00A896",
  error: "#E53E3E",
  info: "#1F4E79",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 90, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderLeft: `4px solid ${TOAST_COLORS[toast.type]}`,
              borderRadius: 12,
              padding: "13px 18px 13px 15px",
              boxShadow: "0 12px 32px -8px rgba(16,40,70,.28)",
              minWidth: 280,
              maxWidth: 440,
              animation: "altms-toast .35s cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: "50%", background: TOAST_COLORS[toast.type], display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1B2A3D" }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
