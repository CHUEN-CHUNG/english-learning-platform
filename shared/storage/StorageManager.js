/**
 * StorageManager.js
 * 純 JavaScript 版本，供瀏覽器直接載入（不需 Vite 編譯）。
 * 預設使用 localStorage；若需 Firebase 請透過 Vite build 使用 StorageManager.ts。
 */

class LocalStorageAdapter {
    async saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            // 若資料已是字串就直接存
            localStorage.setItem(key, String(data));
        }
    }

    async loadData(key) {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        try {
            return JSON.parse(item);
        } catch (e) {
            // 非 JSON 格式時回傳原始字串（保持與舊程式碼的相容性）
            return item;
        }
    }

    async removeData(key) {
        localStorage.removeItem(key);
    }
}

class StorageManager {
    constructor() {
        this._adapter = new LocalStorageAdapter();
    }

    async save(key, data) {
        return this._adapter.saveData(key, data);
    }

    async load(key) {
        return this._adapter.loadData(key);
    }

    async remove(key) {
        return this._adapter.removeData(key);
    }
}

export const appStorage = new StorageManager();
