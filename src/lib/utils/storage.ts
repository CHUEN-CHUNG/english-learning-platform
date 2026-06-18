import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField, collection, getDocs } from 'firebase/firestore';

class StorageManager {
  private cache = new Map<string, string>();
  private useFirebase = import.meta.env.VITE_STORAGE_MODE === 'firebase';
  private currentUser: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) this.cache.set(key, localStorage.getItem(key)!);
      }
    }
  }

  async loadUser(username: string) {
    this.currentUser = username;
    if (this.useFirebase && db) {
      try {
        const userRef = doc(db, 'users', username);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          // Firebase 有資料，以 Firebase 為主，同步到本地
          const data = docSnap.data();
          for (const [k, v] of Object.entries(data)) {
            this.cache.set(k, v as string);
            if (typeof window !== 'undefined') {
              localStorage.setItem(k, v as string);
            }
          }
        } else {
          // Firebase 沒資料 (第一次連線)，把原本 LocalStorage 的進度全部推上去！
          const localData: Record<string, string> = {};
          for (const [k, v] of this.cache.entries()) {
            if (k !== 'current_user') {
              localData[k] = v;
            }
          }
          if (Object.keys(localData).length > 0) {
            await setDoc(userRef, localData, { merge: true });
            console.log("Successfully migrated local data to Firebase for user:", username);
          }
        }
      } catch (err) {
        console.error("Failed to load user data from Firebase:", err);
      }
    }
  }

  getItem(key: string): string | null {
    if (!this.useFirebase && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.cache.get(key) || null;
  }

  setItem(key: string, value: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
    this.cache.set(key, value);

    if (this.useFirebase && this.currentUser && db && key !== 'current_user') {
      const userRef = doc(db, 'users', this.currentUser);
      setDoc(userRef, { [key]: value }, { merge: true }).catch(console.error);
    }
  }

  get isFirebase(): boolean {
    return this.useFirebase && !!db;
  }

  /**
   * 讀取整個 `users` collection（教師大廳跨學生彙整用）。
   * 回傳 { 文件ID: { 欄位: 字串值 } }；非 Firebase 模式回傳空物件。
   */
  async fetchAllUsers(): Promise<Record<string, Record<string, string>>> {
    if (!this.isFirebase || !db) return {};
    try {
      const snap = await getDocs(collection(db, 'users'));
      const result: Record<string, Record<string, string>> = {};
      snap.forEach((d) => {
        result[d.id] = d.data() as Record<string, string>;
      });
      return result;
    } catch (err) {
      console.error('Failed to fetch all users from Firebase:', err);
      return {};
    }
  }

  removeItem(key: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
    this.cache.delete(key);

    if (this.useFirebase && this.currentUser && db && key !== 'current_user') {
      const userRef = doc(db, 'users', this.currentUser);
      updateDoc(userRef, { [key]: deleteField() }).catch(console.error);
    }
  }
}

export const appStorage = new StorageManager();
