import { Pool } from 'pg';

import {
  toAuthenticatedUserView,
  UserQueryRow,
} from '../../application/map-authenticated-user-view';
import { UserQueryRepository } from '../../application/user-query-persistence';

export class PostgresUserQueryRepository implements UserQueryRepository {
  constructor(private readonly pool: Pool) {}

  async findById(
    id: string,
  ): Promise<ReturnType<typeof toAuthenticatedUserView> | null> {
    const result = await this.pool.query<UserQueryRow>(
      `
        SELECT
          id,
          email,
          display_name,
          status,
          created_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toAuthenticatedUserView(result.rows[0]);
  }
}
