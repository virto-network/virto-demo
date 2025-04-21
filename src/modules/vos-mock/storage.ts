import { StoredData } from './types';

/**
 * Simple in-memory storage for the VOS mock service
 */
export class InMemorySessionStorage {
  private static instances: Map<string, InMemorySessionStorage> = new Map();
  private store: Map<string, StoredData>;

  private constructor(public name: string) {
    this.store = new Map<string, StoredData>();
  }

  /**
   * Initialize the storage singleton
   */
  public static initialize(name: string): InMemorySessionStorage {
    if (!InMemorySessionStorage.instances.has(name)) {
      InMemorySessionStorage.instances.set(name, new InMemorySessionStorage(name));
    }
    return InMemorySessionStorage.instances.get(name)!;
  }

  /**
   * Get storage instance
   */
  public static getInstance(name: string): InMemorySessionStorage {
    if (!InMemorySessionStorage.instances.has(name)) {
      return InMemorySessionStorage.initialize(name);
    }
    return InMemorySessionStorage.instances.get(name)!;
  }

  /**
   * Set data for a user
   */
  public set(userId: string, data: StoredData): void {
    this.store.set(userId, data);
  }

  /**
   * Get data for a user
   */
  public get(userId: string): StoredData | undefined {
    return this.store.get(userId);
  }

  /**
   * Delete data for a user
   */
  public delete(userId: string): boolean {
    return this.store.delete(userId);
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.store.clear();
  }
} 