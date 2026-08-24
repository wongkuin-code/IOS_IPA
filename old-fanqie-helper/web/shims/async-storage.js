const PREFIX = 'rn_async_';

const AsyncStorage = {
  getItem(key) {
    try {
      return Promise.resolve(localStorage.getItem(PREFIX + key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(PREFIX + key, String(value));
    } catch {}
    return Promise.resolve();
  },
  removeItem(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
    return Promise.resolve();
  },
  clear() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    return Promise.resolve();
  },
  getAllKeys() {
    try {
      return Promise.resolve(
        Object.keys(localStorage)
          .filter((k) => k.startsWith(PREFIX))
          .map((k) => k.slice(PREFIX.length)),
      );
    } catch {
      return Promise.resolve([]);
    }
  },
};

export default AsyncStorage;
