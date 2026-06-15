import { appStorage } from '$lib/utils/storage';

const STORAGE_KEY = 'current_user';

let _current = $state<string | null>(null);

export const user = {
  get current() { return _current; },

  init() {
    _current = appStorage.getItem(STORAGE_KEY);
    if (_current) {
      appStorage.loadUser(_current);
    }
  },

  async login(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;
    appStorage.setItem(STORAGE_KEY, trimmed);
    _current = trimmed;
    await appStorage.loadUser(trimmed);
    return true;
  },

  logout() {
    appStorage.removeItem(STORAGE_KEY);
    _current = null;
  }
};
