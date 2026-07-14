import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../layouts/AuthLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';

export function LoginPage() {
  const { isAuthenticated, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [tokenInput, setTokenInput] = useState('');

  const redirectPath =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? ROUTES.dashboard;

  if (isAuthenticated) {
    return <Navigate replace to={redirectPath} />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (tokenInput.trim() === '') {
      toast.error(
        'Token requerido',
        'Ingresá un JWT válido para continuar.',
      );
      return;
    }

    setToken(tokenInput);
    toast.success(
      'Sesión iniciada',
      'El token fue guardado correctamente.',
    );
    navigate(redirectPath, { replace: true });
  }

  return (
    <AuthLayout>
      <Card>
        <Section className="space-y-6">
          <PageTitle
            description="Infraestructura JWT preparada. El endpoint de login llegará en un sprint posterior."
            title="Iniciar sesión"
          />

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm" htmlFor="jwt-token">
              <span className="font-medium text-slate-700">Token JWT</span>
              <textarea
                aria-label="Token JWT"
                className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus-visible:border-slate-500"
                id="jwt-token"
                onChange={(event) => {
                  setTokenInput(event.target.value);
                }}
                placeholder="Pegá un Bearer JWT válido para acceder al dashboard"
                value={tokenInput}
              />
            </label>

            <Button aria-label="Guardar token y continuar" className="w-full" type="submit">
              Guardar token y continuar
            </Button>
          </form>
        </Section>
      </Card>
    </AuthLayout>
  );
}
