import { useEffect, useState } from 'react';

export interface ToastItem {
  id: number;
  message: string;
}

const toastListeners = new Set<(item: ToastItem) => void>();
let toastSeq = 0;

/** Lightweight module-level toast (design: no third-party toast dep). */
export function toast(message: string): void {
  const item: ToastItem = { id: ++toastSeq, message };
  toastListeners.forEach((l) => l(item));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 2600);
    };
    toastListeners.add(onToast);
    return () => {
      toastListeners.delete(onToast);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
