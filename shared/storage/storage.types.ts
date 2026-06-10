export interface StorageAdapter {
  saveData(key: string, data: any): Promise<void>;
  loadData(key: string): Promise<any>;
  removeData(key: string): Promise<void>;
}
