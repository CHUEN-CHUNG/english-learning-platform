const STORAGE_KEY = 'current_user';

let _current = $state<string | null>(null);

export const user = {
  get current() { return _current; },

  init() {
    _current = localStorage.getItem(STORAGE_KEY);
  },

  login(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEY, trimmed);
    _current = trimmed;
    return true;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    _current = null;
  }
};
