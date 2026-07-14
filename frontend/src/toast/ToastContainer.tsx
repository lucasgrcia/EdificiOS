import { useEffect, useState } from 'react';

import {
  subscribeToToasts,
  toast,
  type ToastMessage,
  type ToastVariant,
} from './toastStore';

export function useToast() {
  return toast;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-slate-200 bg-white text-slate-900',
};

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => subscribeToToasts(setMessages), []);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg ${variantStyles[message.variant]}`}
          role="status"
        >
          <p className="text-sm font-semibold">{message.title}</p>
          {message.description !== undefined && (
            <p className="mt-1 text-sm opacity-90">{message.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
