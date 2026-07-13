export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string | null;
};

export const PROBLEM_TYPE_NOT_FOUND =
  'https://api.edificios/errors/not-found';
export const PROBLEM_TYPE_BAD_REQUEST =
  'https://api.edificios/errors/bad-request';
export const PROBLEM_TYPE_CONFLICT =
  'https://api.edificios/errors/conflict';
export const PROBLEM_TYPE_FORBIDDEN =
  'https://api.edificios/errors/forbidden';
export const PROBLEM_TYPE_INTERNAL_SERVER_ERROR =
  'https://api.edificios/errors/internal-server-error';

export const PROBLEM_DETAILS_CONTENT_TYPE = 'application/problem+json';
