/**
 * API utility for making requests to the backend.
 *
 * In production the frontend nginx config proxies /api/* to the backend,
 * so we use a relative path (empty base URL). In local development the
 * Vite dev server proxy does the same thing, so relative paths work there
 * too — no need to bake the backend URL into the bundle.
 *
 * VITE_API_URL is kept as an optional override for environments where the
 * proxy approach is not available.
 */

const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  // Only use the explicit URL if it is set AND does not point at localhost
  // (localhost makes no sense when running in a user's browser against a
  //  remote server, and is the most common misconfiguration).
  if (apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
    return apiUrl.replace(/\/$/, '');
  }
  // Fall back to relative paths — nginx proxies /api to the backend
  return '';
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

