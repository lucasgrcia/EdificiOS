export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: Date;
};

export interface UserPersistence {
  create(user: UserRecord): Promise<void>;
}

export interface IdGenerator {
  generate(): string;
}

export type Clock = {
  now(): Date;
};
