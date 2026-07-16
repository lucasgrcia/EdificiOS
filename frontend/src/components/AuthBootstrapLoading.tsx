export function AuthBootstrapLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Restaurando sesión"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span
          aria-hidden
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
        />
        Restaurando sesión…
      </div>
    </div>
  );
}
