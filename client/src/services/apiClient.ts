import { useAuthStore } from '../store/authStore.js';

export function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // In browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0';

    // When running in production (e.g. Vercel)
    if (!isLocalhost) {
      // If an explicit cloud URL was configured, use it
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      // Reliable direct Render production backend
      return 'https://sahaay-7tg0.onrender.com/api';
    }
  }

  return envUrl || 'http://localhost:5000/api';
}

export const API_BASE = getApiBase();

export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          useAuthStore.getState().logout();
        }

        // Render free tier / Gateway cold start or error (502, 503, 504)
        if ([502, 503, 504].includes(response.status) && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }

        const msg =
          data.message ||
          data.error?.message ||
          `Request failed with status ${response.status}`;
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      lastError = err;

      const isNetworkError =
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Load failed');

      if (isNetworkError && attempt < retries) {
        // Wait and retry for waking up cloud backend
        await new Promise((resolve) => setTimeout(resolve, 2500 * (attempt + 1)));
        continue;
      }

      if (isNetworkError) {
        throw new Error(
          'Unable to reach SAHAAY cloud server. The service may be waking up (Render free tier takes ~30 seconds on cold start). Please wait a few seconds and try again.'
        );
      }

      throw err;
    }
  }

  throw lastError;
}
