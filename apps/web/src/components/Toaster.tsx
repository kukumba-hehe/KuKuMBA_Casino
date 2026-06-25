import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastKind, useToasts } from '../store/toast';

const ICON = { success: CheckCircle2, error: XCircle, info: Info };
const TONE: Record<ToastKind, string> = {
  success: 'text-mint',
  error: 'text-roul-red',
  info: 'text-sky',
};

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const remove = useToasts((s) => s.remove);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-fadeup items-start gap-2.5 rounded-2xl border border-white/10 bg-surface-2/95 px-4 py-3 shadow-card backdrop-blur-xl"
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${TONE[t.kind]}`} />
            <span className="flex-1 text-sm leading-snug text-white/90">{t.text}</span>
            <button onClick={() => remove(t.id)} className="shrink-0 text-white/35 transition hover:text-white">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
