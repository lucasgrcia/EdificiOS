import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { UserQueryRepository } from '../src/authentication/application/user-query-persistence';
import { PostgresUserQueryRepository } from '../src/authentication/infrastructure/persistence/postgres-user-query-repository';

describe('Authentication query integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';
  const userRow = {
    id: userId,
    email: 'porter@torre-norte.edificios',
    display_name: 'Carlos Porter',
    status: 'ACTIVE',
    created_at: new Date('2026-07-10T08:00:00.000Z'),
  };
  const expectedView: AuthenticatedUserView = {
    id: userId,
    email: 'porter@torre-norte.edificios',
    displayName: 'Carlos Porter',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  describe('PostgresUserQueryRepository', () => {
    it('returns null when user is not found by id', async () => {
      const pool = {
        query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
      };
      const repository = new PostgresUserQueryRepository(pool as never);

      const result = await repository.findById(
        '00000000-0000-0000-0000-000000000099',
      );

      expect(result).toBeNull();
    });

    it('loads an authenticated user view by id', async () => {
      const queries: Array<{ sql: string; values: unknown[] }> = [];
      const pool = {
        query: jest.fn(async (sql: string, values?: unknown[]) => {
          queries.push({ sql: sql.trim(), values: values ?? [] });
          return {
            rowCount: 1,
            rows: [userRow],
          };
        }),
      };
      const repository = new PostgresUserQueryRepository(pool as never);

      const result = await repository.findById(userId);

      expect(result).toEqual(expectedView);
      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toContain('FROM users');
      expect(queries[0].values).toEqual([userId]);
    });
  });

  describe('GetAuthenticatedUserUseCase', () => {
    function createHarness(view: AuthenticatedUserView | null) {
      const userQueryRepository: UserQueryRepository = {
        findById: jest.fn(async () => view),
      };

      return {
        getAuthenticatedUserUseCase: new GetAuthenticatedUserUseCase({
          userQueryRepository,
        }),
        userQueryRepository,
      };
    }

    it('returns an authenticated user view by id', async () => {
      const harness = createHarness(expectedView);

      const result = await harness.getAuthenticatedUserUseCase.execute({
        userId,
      });

      expect(result).toEqual(expectedView);
      expect(harness.userQueryRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('returns null when user id does not exist', async () => {
      const harness = createHarness(null);

      const result = await harness.getAuthenticatedUserUseCase.execute({
        userId: '00000000-0000-0000-0000-000000000099',
      });

      expect(result).toBeNull();
      expect(harness.userQueryRepository.findById).toHaveBeenCalledWith(
        '00000000-0000-0000-0000-000000000099',
      );
    });

    it('delegates user resolution to the repository', async () => {
      const harness = createHarness(expectedView);

      await harness.getAuthenticatedUserUseCase.execute({ userId });

      expect(harness.userQueryRepository.findById).toHaveBeenCalledTimes(1);
      expect(harness.userQueryRepository.findById).toHaveBeenCalledWith(userId);
    });
  });
});
