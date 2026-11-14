import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStoreState {
  currentToast: ToastItem | null;
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  hideToast: () => void;
}

let toastIdCounter = 1;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStoreState>((set) => ({
  currentToast: null,

  showToast: (
    message: string,
    type: ToastType = 'success',
    durationMs = 3200
  ) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const id = toastIdCounter++;
    set({
      currentToast: {
        id,
        message,
        type,
      },
    });

    if (durationMs > 0) {
      hideTimeout = setTimeout(() => {
        set((state) =>
          state.currentToast?.id === id ? { currentToast: null } : state
        );
      }, durationMs);
      const maybeNodeTimer = hideTimeout as unknown as { unref?: () => void };
      if (typeof maybeNodeTimer?.unref === 'function') {
        maybeNodeTimer.unref();
      }
    }
  },

  hideToast: () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    set({ currentToast: null });
  },
}));
