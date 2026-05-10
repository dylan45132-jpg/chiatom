import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  addToast: (message, type = 'info') => set((state) => ({
    toasts: [
      ...state.toasts,
      { id: crypto.randomUUID(), message, type },
    ],
  })),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}))

// ── 方便直接呼叫，不用在 component 裡 import hook ──
export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, 'success'),
  error:   (message: string) => useToastStore.getState().addToast(message, 'error'),
  info:    (message: string) => useToastStore.getState().addToast(message, 'info'),
}