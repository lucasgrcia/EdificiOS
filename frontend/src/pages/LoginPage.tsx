import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorCard } from '../components/ErrorCard';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../layouts/AuthLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';
import { parseApiError, type ParsedApiError } from '../utils/parseApiError';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<ParsedApiError | null>(null);

  const redirectPath =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? ROUTES.dashboard;

  if (isAuthenticated) {
    return <Navigate replace to={redirectPath} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim() === '') {
      toast.error(
        'Email requerido',
        'Ingresá un email válido para continuar.',
      );
      return;
    }

    setLoginError(null);
    setIsSubmitting(true);

    try {
      await login(email);
      toast.success(
        'Sesión iniciada',
        'Tu acceso al panel operativo está listo.',
      );
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const parsed = parseApiError(error);
      setLoginError(parsed);
      toast.error(parsed.title, parsed.description);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card>
        <Section className="space-y-6">
          <PageTitle
            description="Ingresá con el email de tu cuenta para acceder al panel operativo."
            title="Iniciar sesión"
          />

          {loginError !== null && (
            <ErrorCard
              description={loginError.description}
              title={loginError.title}
            />
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm" htmlFor="login-email">
              <span className="font-medium text-slate-700">Email</span>
              <input
                aria-label="Email"
                autoComplete="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus-visible:border-slate-500"
                disabled={isSubmitting}
                id="login-email"
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                placeholder="demo@edificios.local"
                type="email"
                value={email}
              />
            </label>

            <Button
              aria-label="Iniciar sesión"
              className="w-full"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </Section>
      </Card>
    </AuthLayout>
  );
}
