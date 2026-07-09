export type StoreFileInput = {
  storageReference: string;
  content: Buffer;
};

export type StoredFile = {
  storageReference: string;
  sizeBytes: number;
};

export interface FileStorage {
  store(input: StoreFileInput): Promise<StoredFile>;
  read(storageReference: string): Promise<Buffer>;
  delete(storageReference: string): Promise<void>;
}
