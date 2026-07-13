import { Pool } from 'pg';

import { UserPersistence, UserRecord } from '../../application/user-persistence';

export class PostgresUserRepository implements UserPersistence {
  constructor(private readonly pool: Pool) {}

  async create(user: UserRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO users (
          id,
          email,
          display_name,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        user.id,
        user.email,
        user.displayName,
        user.status,
        user.createdAt,
      ],
    );
  }
}
