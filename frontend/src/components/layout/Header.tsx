import { Button } from '../Button';
import { useToast } from '../../toast/ToastContainer';

type HeaderProps = {
  onMenuClick: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
};

export function Header({
  onMenuClick,
  onLogout,
  showLogout = false,
}: HeaderProps) {
  const toast = useToast();

  function handleLogout() {
    onLogout?.();
    toast.info('Sesión cerrada', 'Tu token fue eliminado de este dispositivo.');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Abrir menú de navegación"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
        <span className="truncate text-sm font-medium text-slate-600">
          Panel operativo
        </span>
      </div>

      {showLogout && onLogout !== undefined && (
        <Button
          aria-label="Cerrar sesión"
          onClick={handleLogout}
          variant="ghost"
        >
          Cerrar sesión
        </Button>
      )}
    </header>
  );
}
