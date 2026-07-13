import { AuthenticatedUserView } from './authenticated-user-view';

export type UserQueryRow = {
  id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: Date;
};

export function toAuthenticatedUserView(
  row: UserQueryRow,
): AuthenticatedUserView {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}
