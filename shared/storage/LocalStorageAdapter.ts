import { StorageAdapter } from './storage.types';

export class LocalStorageAdapter implements StorageAdapter {
  async saveData(key: string, data: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async loadData(key: string): Promise<any> {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item);
    } catch (e) {
      // If it's not JSON, return as string (for simple string values)
      return item;
    }
  }

  async removeData(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}
