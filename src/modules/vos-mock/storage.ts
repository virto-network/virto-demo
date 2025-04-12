import { StoredData } from './types';

/**
 * Simple in-memory storage for the VOS mock service
 */
export class Storage {
  private static instance: Storage;
  private store: Map<string, StoredData>;

  private constructor() {
    this.store = new Map<string, StoredData>();
  }

  /**
   * Initialize the storage singleton
   */
  public static initialize(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  /**
   * Get storage instance
   */
  public static getInstance(): Storage {
    if (!Storage.instance) {
      return Storage.initialize();
    }
    return Storage.instance;
  }

  /**
   * Set data for a user
   */
  public static set(userId: string, data: StoredData): void {
    const instance = Storage.getInstance();
    instance.store.set(userId, data);
  }

  /**
   * Get data for a user
   */
  public static get(userId: string): StoredData | undefined {
    const instance = Storage.getInstance();
    return instance.store.get(userId);
  }

  /**
   * Delete data for a user
   */
  public static delete(userId: string): boolean {
    const instance = Storage.getInstance();
    return instance.store.delete(userId);
  }

  /**
   * Clear all data
   */
  public static clear(): void {
    const instance = Storage.getInstance();
    instance.store.clear();
  }
} 