/**
 * API utility for making requests to the backend
 * Uses VITE_API_URL environment variable if available, otherwise uses relative paths
 */

const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
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

