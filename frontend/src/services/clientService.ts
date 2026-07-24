import { encryptData } from '../utils/encryption';

// API base URL - reads from VITE_API_URL (baked in at build time by Vite)
// Falls back to relative path which works in local dev via Vite proxy
const API_BASE_URL = `${(import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '')}/api`;

export interface ClientRegistrationData {
  name: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  email: string;
  contactPerson?: string;
}

export interface ClientRegistrationResponse {
  clientId: number;
  clientName: string;
  message: string;
  emailSent: boolean;
  createdAt: string;
  adminEmail?: string;
}

export interface ClientRegistrationRequest {
  encryptedClientData: string;
}

/**
 * Registers a new client with encrypted data transmission
 */
export const registerClient = async (clientData: ClientRegistrationData): Promise<ClientRegistrationResponse> => {
  try {
    // Temporarily bypass encryption for debugging
    console.log('Client data being sent:', clientData);
    
    // Encrypt the client data
    const encryptedData = encryptData(clientData);
    console.log('Encrypted data:', encryptedData);
    
    const request: ClientRegistrationRequest = {
      encryptedClientData: encryptedData
    };

    console.log('Request payload:', request);

    const response = await fetch(`${API_BASE_URL}/clients/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Registration failed: ${response.status} - ${errorText}`);
    }

    const result: ClientRegistrationResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Client registration error:', error);
    throw error;
  }
};

/**
 * Fetches all clients (for admin purposes)
 */
export const getClients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Fetches a specific client by ID
 */
export const getClient = async (id: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};