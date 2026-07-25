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

/** Decode JWT payload without a library */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Returns true if the token is missing or expired */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  // exp is in seconds, Date.now() is in ms
  return payload.exp * 1000 < Date.now();
}

/** Clear all auth state and redirect to login */
export function forceLogout(reason = 'session_expired') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('learner_token');
  localStorage.removeItem('learner_user');
  // Redirect to login with reason so the login page can show a message
  window.location.href = `/login?reason=${reason}`;
}

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const apiUrl = getApiUrl();
  const url = apiUrl ? `${apiUrl}${endpoint}` : endpoint;

  // Check token expiry before making the request
  const token = localStorage.getItem('token');
  if (token && isTokenExpired(token)) {
    forceLogout('session_expired');
    return new Response(null, { status: 401 });
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // If the server returns 401, force logout
  if (response.status === 401) {
    forceLogout('session_expired');
  }

  return response;
};

export default getApiUrl;
