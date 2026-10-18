import type { AuthTokens } from './auth-types';

const ACCESS_TOKEN_KEY = 'dolphin.accessToken';
const REFRESH_TOKEN_KEY = 'dolphin.refreshToken';

function read(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  if (typeof window === 'undefined') {
    throw new Error('Token storage is only available in the browser.');
  }

  window.sessionStorage.setItem(key, value);
}

function remove(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage cleanup must not hide the original authentication error.
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return read(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return read(REFRESH_TOKEN_KEY);
  },

  save(tokens: AuthTokens): void {
    write(ACCESS_TOKEN_KEY, tokens.accessToken);

    try {
      write(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch (error) {
      remove(ACCESS_TOKEN_KEY);
      throw error;
    }
  },

  clear(): void {
    remove(ACCESS_TOKEN_KEY);
    remove(REFRESH_TOKEN_KEY);
  },
};