import { NotificationStatus, NotificationType } from '../types/enums';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface NotificationLog {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  sentTo: string;
  error?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  tradeName?: string | null;
  address: string;
  createdAt: string;
  updatedAt: string;
  notifications?: NotificationLog[];
  _count?: {
    notifications: number;
  };
}

export type CompanyDTO = Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'notifications' | '_count'>;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const messages = body?.message;
    if (Array.isArray(messages)) {
      throw new Error(messages.join('\n'));
    }
    throw new Error(messages || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const api = {
  getCompanies: async (page = 1, limit = 10, search = ''): Promise<PaginatedResponse<Company>> => {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search
    }).toString();
    const res = await fetch(`${API_URL}/companies?${query}`);
    return handleResponse<PaginatedResponse<Company>>(res);
  },

  getCompany: async (id: string): Promise<Company> => {
    const res = await fetch(`${API_URL}/companies/${id}`);
    return handleResponse<Company>(res);
  },

  getCompanyLogs: async (id: string): Promise<NotificationLog[]> => {
    const res = await fetch(`${API_URL}/companies/${id}/logs`);
    return handleResponse<NotificationLog[]>(res);
  },

  createCompany: async (data: CompanyDTO): Promise<Company> => {
    const res = await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(res);
  },

  updateCompany: async (id: string, data: Partial<CompanyDTO>): Promise<Company> => {
    const res = await fetch(`${API_URL}/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(res);
  },

  deleteCompany: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || 'Falha ao excluir empresa');
    }
  },

  retryNotification: async (id: string, notificationId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/companies/${id}/notifications/${notificationId}/retry`, { 
      method: 'POST' 
    });
    return handleResponse<void>(res);
  },
};
