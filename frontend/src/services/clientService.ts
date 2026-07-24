// API base URL - reads from VITE_API_URL (baked in at build time by Vite)
const API_BASE_URL = `${(import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '')}/api`;

export interface ClientRegistrationData {
  name: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email: string;
  contactPerson?: string;
  websiteLink?: string;
  attendanceType?: string;
  logoUrl?: string;
}

export interface ClientRegistrationResponse {
  clientId: number;
  clientName: string;
  message: string;
  emailSent: boolean;
  createdAt: string;
  adminEmail?: string;
}

/**
 * Registers a new client.
 * Sends plain JSON over HTTPS — TLS handles transport security.
 */
export const registerClient = async (clientData: ClientRegistrationData): Promise<ClientRegistrationResponse> => {
  const response = await fetch(`${API_BASE_URL}/clients/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Registration failed: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage} - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<ClientRegistrationResponse>;
};

/**
 * Fetches all clients
 */
export const getClients = async () => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch clients: ${response.status}`);
  return response.json();
};

/**
 * Fetches a specific client by ID
 */
export const getClient = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Failed to fetch client: ${response.status}`);
  return response.json();
};
