/**
 * API utility for making requests to the backend.
 *
 * VITE_API_URL is baked into the bundle at build time by Vite.
 * In Railway: set VITE_API_URL as a build variable on the Frontend service,
 * pointing to the backend service public URL.
 * In local dev: set VITE_API_URL=http://localhost:5213 in frontend/.env
 */

const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return apiUrl ? apiUrl.replace(/\/$/, '') : '';
};

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const apiUrl = getApiUrl();
  const url = apiUrl ? `${apiUrl}${endpoint}` : endpoint;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

export default getApiUrl;
