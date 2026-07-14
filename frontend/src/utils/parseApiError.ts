import axios from 'axios';

import type { ProblemDetails } from '../types/problemDetails';

export type ParsedApiError = {
  title: string;
  description: string;
};

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === 'string' &&
    typeof candidate.detail === 'string' &&
    typeof candidate.status === 'number'
  );
}

export function parseApiError(error: unknown): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (error.response?.data !== undefined && isProblemDetails(error.response.data)) {
      return {
        title: error.response.data.title,
        description: error.response.data.detail,
      };
    }

    if (error.response === undefined) {
      return {
        title: 'Error de red',
        description:
          'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
      };
    }
  }

  return {
    title: 'Algo salió mal',
    description:
      'Ocurrió un error inesperado. Intentá nuevamente en unos instantes.',
  };
}
