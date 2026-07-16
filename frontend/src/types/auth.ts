export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
};

export type LoginRequest = {
  email: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};
