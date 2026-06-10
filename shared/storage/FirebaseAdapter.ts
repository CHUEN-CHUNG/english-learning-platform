import { StorageAdapter } from './storage.types';
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; 

export class FirebaseAdapter implements StorageAdapter {
  private collectionName = "appData"; 

  async saveData(key: string, data: any): Promise<void> {
    const docRef = doc(db, this.collectionName, key);
    // Firestore requires objects, so if data is a primitive, wrap it
    if (typeof data !== 'object' || data === null) {
      await setDoc(docRef, { value: data });
    } else {
      await setDoc(docRef, data);
    }
  }

  async loadData(key: string): Promise<any> {
    const docRef = doc(db, this.collectionName, key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.value !== undefined ? data.value : data;
    }
    return null;
  }

  async removeData(key: string): Promise<void> {
    const docRef = doc(db, this.collectionName, key);
    await deleteDoc(docRef);
  }
}
