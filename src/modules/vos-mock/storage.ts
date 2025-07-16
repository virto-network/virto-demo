import { StoredData } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * JSON file-based storage for the VOS mock service
 */
export class InMemorySessionStorage {
  private static instances: Map<string, InMemorySessionStorage> = new Map();
  private store: Map<string, StoredData>;
  private filePath: string;

  private constructor(public name: string) {
    this.store = new Map<string, StoredData>();
    this.filePath = path.join(process.cwd(), 'storage', `${name}.json`);
    this.loadFromFile();
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
   * Load data from JSON file
   */
  private loadFromFile(): void {
    try {
      // Ensure storage directory exists
      const storageDir = path.dirname(this.filePath);
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      // Load data from file if it exists
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.store = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error(`Error loading storage from ${this.filePath}:`, error);
      this.store = new Map<string, StoredData>();
    }
  }

  /**
   * Save data to JSON file
   */
  private saveToFile(): void {
    try {
      const data = Object.fromEntries(this.store);
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error saving storage to ${this.filePath}:`, error);
    }
  }

  /**
   * Set data for a user
   */
  public set(userId: string, data: StoredData): void {
    this.store.set(userId, data);
    this.saveToFile();
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
    const result = this.store.delete(userId);
    if (result) {
      this.saveToFile();
    }
    return result;
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.store.clear();
    this.saveToFile();
  }
} 