import { fetchWithAuth, getApiBase } from './apiClient.js';
import { useAuthStore } from '../store/authStore.js';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (payload: any) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => fetchWithAuth('/auth/me'),

  pingHealth: () => fetchWithAuth('/health'),

  verifyPan: (panNumber: string) =>
    fetchWithAuth('/auth/verify-pan', {
      method: 'POST',
      body: JSON.stringify({ panNumber }),
    }),

  verifyFace: (formData: FormData) =>
    fetchWithAuth('/auth/verify-face', {
      method: 'POST',
      body: formData,
    }),
};

export const citizenApi = {
  getCitizenDashboard: () => fetchWithAuth('/citizen/dashboard'),
  getCitizenCases: () => fetchWithAuth('/citizen/cases'),
};

export const caseApi = {
  getCaseById: (id: string) => fetchWithAuth(`/cases/${id}`),
  getCaseTimeline: (id: string) => fetchWithAuth(`/cases/${id}/timeline`),
  getCaseCompensation: (id: string) => fetchWithAuth(`/cases/${id}/compensation`),
  getCaseRR: (id: string) => fetchWithAuth(`/cases/${id}/rr`),
  getCaseDocuments: (id: string) => fetchWithAuth(`/cases/${id}/documents`),
  getCaseActions: (id: string) => fetchWithAuth(`/cases/${id}/actions`),
  updateActionStatus: (actionId: string, status: string) =>
    fetchWithAuth(`/cases/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

export const parcelApi = {
  searchParcels: (params: { q?: string; survey?: string; village?: string; district?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/parcels/search?${query}`);
  },
  getParcelById: (id: string) => fetchWithAuth(`/parcels/${id}`),
  interactWithParcel: (id: string, payload?: { status?: string; action?: string }) =>
    fetchWithAuth(`/parcels/${id}/interact`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
};


export const documentApi = {
  uploadDocument: (formData: FormData) =>
    fetchWithAuth('/documents/upload', {
      method: 'POST',
      body: formData,
    }),
  getUserDocuments: () => fetchWithAuth('/documents/my'),
  getDocumentById: (id: string) => fetchWithAuth(`/documents/${id}`),
};

export const grievanceApi = {
  createGrievance: (payload: {
    caseId?: string;
    parcelId?: string;
    category: string;
    title: string;
    description: string;
    detectedDiscrepancy?: any;
    attachmentUrl?: string;
  }) =>
    fetchWithAuth('/grievances', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGrievances: () => fetchWithAuth('/grievances'),
  getGrievanceById: (id: string) => fetchWithAuth(`/grievances/${id}`),
};

export const notificationApi = {
  getNotifications: () => fetchWithAuth('/notifications'),
  markNotificationRead: (id: string) =>
    fetchWithAuth(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    fetchWithAuth('/notifications/read-all', {
      method: 'PATCH',
    }),
};

export const officerApi = {
  getOfficerDashboard: () => fetchWithAuth('/officer/dashboard'),
  getOfficerCases: (params?: { stage?: string; search?: string }) => {
    const query = params ? new URLSearchParams(params as any).toString() : '';
    return fetchWithAuth(`/officer/cases${query ? `?${query}` : ''}`);
  },
  updateGrievanceStatus: (id: string, payload: { status: string; officerResponse: string }) =>
    fetchWithAuth(`/officer/grievances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateCaseStage: (id: string, payload: { stage: string; remarks?: string }) =>
    fetchWithAuth(`/officer/cases/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const aiApi = {
  extractDocumentDirect: (payload: { rawText: string; filename?: string }) =>
    fetchWithAuth('/ai/extract-document', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  explainDocument: (payload: { rawText: string; docType?: string; language?: string }) =>
    fetchWithAuth('/ai/explain-document', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  streamExplainDocument: async (
    payload: { rawText: string; docType?: string; language?: string },
    onChunk: (chunk: string) => void
  ) => {
    const token = useAuthStore.getState().token;
    const baseUrl = getApiBase();

    const response = await fetch(`${baseUrl}/ai/explain-document/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            }
          } catch {
            // ignore partial line
          }
        }
      }
    }
  },
};

// Unified api object for backward compatibility across all existing pages
export const api = {
  ...authApi,
  ...citizenApi,
  ...caseApi,
  ...parcelApi,
  ...documentApi,
  ...grievanceApi,
  ...notificationApi,
  ...officerApi,
  ...aiApi,
};

