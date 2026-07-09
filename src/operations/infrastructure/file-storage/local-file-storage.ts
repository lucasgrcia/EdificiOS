import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  FileStorage,
  StoreFileInput,
  StoredFile,
} from '../../application/file-storage';
import { StorageReference } from '../../domain/evidence/value-objects/storage-reference';

export type LocalFileStorageOptions = {
  basePath: string;
};

export class LocalFileStorage implements FileStorage {
  constructor(private readonly options: LocalFileStorageOptions) {}

  async store(input: StoreFileInput): Promise<StoredFile> {
    const storageReference = StorageReference.create(input.storageReference);
    const absolutePath = this.resolvePath(storageReference);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.content);

    return {
      storageReference: storageReference.toString(),
      sizeBytes: input.content.byteLength,
    };
  }

  async read(storageReference: string): Promise<Buffer> {
    return readFile(this.resolvePath(StorageReference.create(storageReference)));
  }

  async delete(storageReference: string): Promise<void> {
    await unlink(this.resolvePath(StorageReference.create(storageReference)));
  }

  private resolvePath(storageReference: StorageReference): string {
    return path.join(this.options.basePath, storageReference.toString());
  }
}
