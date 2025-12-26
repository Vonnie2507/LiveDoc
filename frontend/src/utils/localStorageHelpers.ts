export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

export function setUserPreference(key: string, value: any): void {
  const stringified = JSON.stringify(value);
  localStorage.setItem('pref_' + key, stringified);
}

export function getUserPreference<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem('pref_' + key);
  if (stored === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

export function clearAllPreferences(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pref_')) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}