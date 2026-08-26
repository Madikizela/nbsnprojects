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

/** Name of the custom event used to request an SPA-friendly logout redirect. */
export const AUTH_LOGOUT_EVENT = 'app:auth-logout';

/** Decode JWT payload without a library — returns full claims object (not just exp). */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}

/** Returns true if the token is missing or expired */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  // exp is in seconds, Date.now() is in ms
  return payload.exp * 1000 < Date.now();
}

/**
 * Normalized view of a user's role + resource bindings.
 * Rules are intentionally mirrored with Login.tsx's role→dashboard routing
 * so role checks live in exactly one place and can't drift.
 */
export interface RoleInfo {
  roleId: string;
  userType?: string;
  departmentName: string;
  departmentId: number | null;
  clientId: number | null;
  sdpId: number | null;
  accessLevel: number;
  isSysAdmin: boolean;
  isClient: boolean;
  isSDP: boolean;
  isManager: boolean;       // Logistics / QA / AdminMgr / Finance / IT → SDPManagerDashboard
  isExternal: boolean;      // ExternalUser role
  isQA: boolean;
  isFinance: boolean;
  isLogistics: boolean;
  isIT: boolean;
  isAdminManager: boolean;
}

/** Shape of the `user` object stored in localStorage after login. */
export interface NormalizedUser {
  id?: number | string;
  role?: string | number;
  userType?: string;
  accessLevel?: number;
  clientId?: number | null;
  skillsDevelopmentProviderId?: number | null;
  departmentId?: number | null;
  departmentName?: string | null;
}

/**
 * Derive normalized RoleInfo from a stored user object.
 * Precedence chain is identical to Login.tsx#L115-L159.
 */
export function getUserRoleInfo(user: NormalizedUser | null | undefined): RoleInfo {
  const role = String(user?.role ?? '');
  const userType = user?.userType;
  const accessLevel = Number(user?.accessLevel ?? 0);
  const clientId = typeof user?.clientId === 'number' ? user.clientId : null;
  const sdpId = typeof user?.skillsDevelopmentProviderId === 'number' ? user.skillsDevelopmentProviderId : null;
  const deptName = (user?.departmentName || '').toLowerCase();
  const deptId = typeof user?.departmentId === 'number' ? user.departmentId : null;

  // SysAdmin = role 1 or any system admin role string
  const isSysAdmin =
    role === '1' ||
    role === 'SystemAdmin' ||
    role === 'SuperAdmin' ||
    role === 'Administrator' ||
    role === 'Admin';

  // ClientAdmin
  const isClient =
    !isSysAdmin &&
    (role === 'ClientAdmin' ||
      role === '2' ||
      userType === 'ClientAdmin' ||
      accessLevel === 3 ||
      (clientId !== null && clientId > 0));

  // SDP Administrator (non-manager)
  const isSDP =
    !isSysAdmin &&
    !isClient &&
    (role === 'SDPAdministrator' ||
      role === '3' ||
      userType === 'SDPAdmin' ||
      (sdpId !== null && sdpId > 0));

  // Logistics
  const isLogistics = role === '5' || role === '12' || deptName.includes('logistic');

  // QA — Moderators / Assessors
  const isQA =
    role === '7' || role === '14' || role === '8' ||
    role === 'SDPModerator' || role === 'SDPAssessor' ||
    deptName.includes('quality') || deptName.includes('moderator') || deptName.includes('assessor');

  // Admin Manager / department-level admin inside SDP
  const isAdminManager =
    (role === '3' && deptId !== null) ||
    role === '15' ||
    (role === 'SDPAdministrator' && deptId !== null) ||
    deptName.includes('admin');

  // Finance
  const isFinance = role === '4' || role === '11' || deptName.includes('finance');

  // IT
  const isIT = role === '6' || role === '13' || role === 'SDPIT' || deptName.includes('it');

  // Manager umbrella (any specific departmental role → SDPManagerDashboard)
  const isManager = isSysAdmin || isLogistics || isQA || isAdminManager || isFinance || isIT;

  // External
  const isExternal = role === '18' || role === 'ExternalUser';

  return {
    roleId: role,
    userType,
    departmentName: user?.departmentName ?? '',
    departmentId: deptId,
    clientId,
    sdpId,
    accessLevel,
    isSysAdmin,
    isClient,
    isSDP,
    isManager,
    isExternal,
    isQA,
    isFinance,
    isLogistics,
    isIT,
    isAdminManager,
  };
}

/** Convenience — read and parse the stored user (staff/portal auth). */
export function getStoredUser(): NormalizedUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as NormalizedUser) : null;
  } catch {
    return null;
  }
}

/** Convenience — read stored learner user + token. */
export function getStoredLearner(): { user: unknown | null; token: string | null } {
  const token = localStorage.getItem('learner_token');
  try {
    const raw = localStorage.getItem('learner_user');
    return { user: raw ? JSON.parse(raw) : null, token };
  } catch {
    return { user: null, token };
  }
}

/**
 * Clear all auth state and request an SPA-friendly logout redirect.
 * Emits the AUTH_LOGOUT_EVENT custom event with the reason. App.tsx subscribes
 * to this event and uses useNavigate() for a soft redirect without a full page
 * reload (which used to cause double router initialization + state wipe).
 */
export function forceLogout(reason = 'session_expired') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('learner_token');
  localStorage.removeItem('learner_user');

  // Emit SPA-friendly event. If no one is listening (App.tsx not mounted yet),
  // fall back to a full page reload so we still get to /login.
  const event = new CustomEvent<string>(AUTH_LOGOUT_EVENT, { detail: reason });
  const handled = window.dispatchEvent(event);
  if (!handled) {
    window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
  }
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
