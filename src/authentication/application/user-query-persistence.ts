import { AuthenticatedUserView } from './authenticated-user-view';

export interface UserQueryRepository {
  findById(id: string): Promise<AuthenticatedUserView | null>;
  findByEmail(email: string): Promise<AuthenticatedUserView | null>;
}
