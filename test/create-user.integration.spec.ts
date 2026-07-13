import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { UserPersistence, UserRecord } from '../src/authentication/application/user-persistence';
import { PostgresUserRepository } from '../src/authentication/infrastructure/persistence/postgres-user-repository';

describe('CreateUserUseCase integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');

  function createRepository() {
    const users = new Map<string, UserRecord>();

    return {
      create: jest.fn(async (record: UserRecord) => {
        users.set(record.id, structuredClone(record));
      }),
      users,
    };
  }

  function createUseCase(userRepository: UserPersistence) {
    return new CreateUserUseCase({
      userRepository,
      idGenerator: {
        generate: () => userId,
      },
      clock: {
        now: () => createdAt,
      },
    });
  }

  describe('CreateUserUseCase', () => {
    it('creates a user successfully', async () => {
      const userRepository = createRepository();
      const useCase = createUseCase(userRepository);

      const result = await useCase.execute({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });

      expect(result).toEqual({ userId });
      expect(userRepository.users.get(userId)).toEqual({
        id: userId,
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
        status: 'ACTIVE',
        createdAt,
      });
    });

    it('normalizes email to lowercase', async () => {
      const userRepository = createRepository();
      const useCase = createUseCase(userRepository);

      await useCase.execute({
        email: '  PORTER@Torre-Norte.Edificios  ',
        displayName: 'Carlos Porter',
      });

      expect(userRepository.users.get(userId)?.email).toBe(
        'porter@torre-norte.edificios',
      );
    });

    it('trims displayName', async () => {
      const userRepository = createRepository();
      const useCase = createUseCase(userRepository);

      await useCase.execute({
        email: 'porter@torre-norte.edificios',
        displayName: '  Carlos Porter  ',
      });

      expect(userRepository.users.get(userId)?.displayName).toBe('Carlos Porter');
    });

    it('generates a user id', async () => {
      const userRepository = createRepository();
      const useCase = createUseCase(userRepository);

      const result = await useCase.execute({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });

      expect(result.userId).toBe(userId);
      expect(userRepository.users.has(userId)).toBe(true);
    });

    it('delegates persistence to the repository', async () => {
      const userRepository = createRepository();
      const useCase = createUseCase(userRepository);

      await useCase.execute({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith({
        id: userId,
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
        status: 'ACTIVE',
        createdAt,
      });
    });
  });

  describe('PostgresUserRepository', () => {
    it('inserts a user into the users table', async () => {
      const queries: Array<{ sql: string; values: unknown[] }> = [];
      const pool = {
        query: jest.fn(async (sql: string, values?: unknown[]) => {
          queries.push({ sql: sql.trim(), values: values ?? [] });
          return { rowCount: 1, rows: [] };
        }),
      };
      const repository = new PostgresUserRepository(pool as never);
      const record: UserRecord = {
        id: userId,
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
        status: 'ACTIVE',
        createdAt,
      };

      await repository.create(record);

      expect(queries).toHaveLength(1);
      expect(queries[0].sql).toContain('INSERT INTO users');
      expect(queries[0].values).toEqual([
        userId,
        'porter@torre-norte.edificios',
        'Carlos Porter',
        'ACTIVE',
        createdAt,
      ]);
    });
  });
});
