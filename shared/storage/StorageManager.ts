import { StorageAdapter } from './storage.types';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { FirebaseAdapter } from './FirebaseAdapter';


export class StorageManager {
  private adapter: StorageAdapter;

  constructor(useFirebase?: boolean) {
    // 如果沒有傳入參數，就從 .env 讀取 VITE_STORAGE_MODE
    if (useFirebase === undefined) {
      useFirebase = import.meta.env.VITE_STORAGE_MODE === 'firebase';
    }
    this.adapter = useFirebase ? new FirebaseAdapter() : new LocalStorageAdapter();
  }

  setStorageType(useFirebase: boolean) {
    this.adapter = useFirebase ? new FirebaseAdapter() : new LocalStorageAdapter();
    console.log(`Switched to ${useFirebase ? 'Firebase' : 'LocalStorage'} mode`);
  }

  async save(key: string, data: any) {
    return this.adapter.saveData(key, data);
  }

  async load(key: string) {
    return this.adapter.loadData(key);
  }

  async remove(key: string) {
    return this.adapter.removeData(key);
  }
}

// 預設不傳入參數，讓它自動讀取 .env 的設定
export const appStorage = new StorageManager();
