export interface ToastItem {
  id: number;
  message: string;
}

const toastListeners = new Set<(item: ToastItem) => void>();
let toastSeq = 0;

/** Lightweight module-level toast (design: no third-party toast dep). */
export function toast(message: string): void {
  const item: ToastItem = { id: ++toastSeq, message };
  toastListeners.forEach((listener) => listener(item));
}

export function subscribeToasts(listener: (item: ToastItem) => void): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}
