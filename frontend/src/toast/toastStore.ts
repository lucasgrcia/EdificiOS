export type ToastVariant = 'success' | 'error' | 'info';

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  description?: string;
};

export type ToastMessage = ToastInput & {
  id: string;
};

type ToastListener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners = new Set<ToastListener>();
let nextId = 0;

function emit(): void {
  for (const listener of listeners) {
    listener([...toasts]);
  }
}

function removeToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);

  return () => {
    listeners.delete(listener);
  };
}

export function showToast(input: ToastInput): void {
  const id = `toast-${nextId}`;
  nextId += 1;

  toasts = [...toasts, { ...input, id }];
  emit();

  window.setTimeout(() => {
    removeToast(id);
  }, 4500);
}

export const toast = {
  success(title: string, description?: string) {
    showToast({ variant: 'success', title, description });
  },
  error(title: string, description?: string) {
    showToast({ variant: 'error', title, description });
  },
  info(title: string, description?: string) {
    showToast({ variant: 'info', title, description });
  },
};
