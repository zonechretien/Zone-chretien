// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach JWT token from localStorage
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('glorysound_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — refresh token or redirect to login
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('glorysound_refresh');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('glorysound_token', data.accessToken);
        localStorage.setItem('glorysound_refresh', data.refreshToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(original);
      } catch {
        localStorage.removeItem('glorysound_token');
        localStorage.removeItem('glorysound_refresh');
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/connexion';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Typed API methods ─────────────────────────────────────────

export const publicationsAPI = {
  list: (params?: Record<string, unknown>) => api.get('/publications', { params }),
  getBySlug: (slug: string) => api.get(`/publications/${slug}`),
  getAll: (params?: any) => api.get('/publications', { params }),
  get: (slug: string) => api.get(`/publications/${slug}`),
  create: (data: unknown) => api.post('/publications', data),
  update: (id: string, data: unknown) => api.put(`/publications/${id}`, data),
  delete: (id: string) => api.delete(`/publications/${id}`),
};

export const musiquesAPI = {
  list: (params?: Record<string, unknown>) => api.get('/musiques', { params }),
  get: (slug: string) => api.get(`/musiques/${slug}`),
  top50: () => api.get('/musiques/top50'),
  create: (data: unknown) => api.post('/musiques', data),
  update: (id: string, data: unknown) => api.put(`/musiques/${id}`, data),
  delete: (id: string) => api.delete(`/musiques/${id}`),
  trackPlay: (id: string) => api.post(`/musiques/${id}/ecoute`),
};

export const artistesAPI = {
  list: (params?: Record<string, unknown>) => api.get('/artistes', { params }),
  getAll: (params?: Record<string, unknown>) => api.get('/artistes', { params }),
  get: (slug: string) => api.get(`/artistes/${slug}`),
  create: (data: unknown) => api.post('/artistes', data),
  update: (id: string, data: unknown) => api.put(`/artistes/${id}`, data),
  delete: (id: string) => api.delete(`/artistes/${id}`),
};

export const videosAPI = {
  list: (params?: Record<string, unknown>) => api.get('/videos', { params }),
  get: (slug: string) => api.get(`/videos/${slug}`),
  create: (data: unknown) => api.post('/videos', data),
  update: (id: string, data: unknown) => api.put(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
};

export const evenementsAPI = {
  list: (params?: Record<string, unknown>) => api.get('/evenements', { params }),
  getAll: (params?: Record<string, unknown>) => api.get('/evenements', { params }),
  get: (slug: string) => api.get(`/evenements/${slug}`),
  create: (data: unknown) => api.post('/evenements', data),
  update: (id: string, data: unknown) => api.put(`/evenements/${id}`, data),
  delete: (id: string) => api.delete(`/evenements/${id}`),
  inscrire: (id: string) => api.post(`/evenements/${id}/inscription`),
};

export const galerieAPI = {
  albums: (params?: Record<string, unknown>) => api.get('/galerie/albums', { params }),
  album: (slug: string) => api.get(`/galerie/albums/${slug}`),
  createAlbum: (data: unknown) => api.post('/galerie/albums', data),
  updateAlbum: (id: string, data: unknown) => api.put(`/galerie/albums/${id}`, data),
  deleteAlbum: (id: string) => api.delete(`/galerie/albums/${id}`),
  // Uploads files to Cloudinary via media route, then registers URLs in album
  uploadPhotos: async (albumId: string, formData: FormData) => {
    // Rename field from 'photos' to 'files' as required by /media/upload-multiple
    const fd = new FormData();
    formData.getAll('photos').forEach((f) => fd.append('files', f));
    const uploadRes = await api.post('/media/upload-multiple', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const uploadedFiles: any[] = uploadRes.data?.files || [];
    if (!uploadedFiles.length) return uploadRes;
    return api.post('/galerie/photos', {
      albumId,
      photos: uploadedFiles.map((f, i) => ({ url: f.url, ordre: i })),
    });
  },
  deletePhoto: (photoId: string) => api.delete(`/galerie/photos/${photoId}`),
};

// Galerie photos (carousel) des articles et événements
export const mediaGalerieAPI = {
  uploadFiles: async (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    const res = await api.post('/media/upload-multiple', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (res.data?.files || []) as Array<{ url: string }>;
  },
  sync: (data: { publicationId?: string; evenementId?: string; items: Array<{ id?: string; url: string; caption?: string | null }> }) =>
    api.put('/media-galerie/sync', data),
};

export const temoignagesAPI = {
  list: (params?: Record<string, unknown>) => api.get('/temoignages', { params }),
  getAll: (params?: Record<string, unknown>) => api.get('/temoignages/admin/tous', { params }),
  submit: (data: unknown) => api.post('/temoignages', data),
  updateStatus: (id: string, data: unknown) => api.patch(`/temoignages/${id}/statut`, data),
  updateStatut: (id: string, statut: string) =>
    api.patch(`/temoignages/${id}/statut`, { status: statut }),
  delete: (id: string) => api.delete(`/temoignages/${id}`),
};

export const newsletterAPI = {
  subscribe: (data: unknown) => api.post('/newsletter/subscribe', data),
  confirm: (token: string) => api.get(`/newsletter/confirmer?token=${token}`),
  sendCampaign: (data: unknown) => api.post('/newsletter/campagnes', data),
  envoyerCampagne: (data: any) =>
    api.post('/newsletter/campagnes', { objet: data.sujet, contenu: data.contenu }),
  getAbonnes: (params?: Record<string, unknown>) => api.get('/newsletter/abonnes', { params }),
  getCampagnes: (params?: Record<string, unknown>) =>
    api.get('/newsletter/campagnes', { params }),
  desinscrire: (email: string) => api.post('/newsletter/unsubscribe', { email }),
  abonnes: (params?: Record<string, unknown>) => api.get('/newsletter/abonnes', { params }),
};

export const mediaAPI = {
  upload: (formData: FormData) =>
    api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadMultiple: (formData: FormData) =>
    api.post('/media/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: Record<string, unknown>) => api.get('/media', { params }),
  delete: (id: string) => api.delete(`/media/${id}`),
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  trackPageView: (path: string, referer?: string) =>
    api.post('/analytics/pageview', { path, referer }).catch(() => {}),
};

export const searchAPI = {
  search: (q: string, type?: string) => api.get('/search', { params: { q, type } }),
};

export const seoAPI = {
  getSettings: () => api.get('/seo/settings'),
  updateSettings: (data: unknown) => api.put('/seo/settings', data),
  sitemap: () => api.get('/seo/sitemap'),
};

export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const utilisateursAPI = {
  getAll: (params?: unknown) => api.get('/utilisateurs', { params }),
  create: (data: unknown) => api.post('/utilisateurs', data),
  update: (id: string, data: unknown) => api.put(`/utilisateurs/${id}`, data),
  delete: (id: string) => api.delete(`/utilisateurs/${id}`),
};

export const agentAPI = {
  status: () => api.get('/agent/status'),
  enable: () => api.post('/agent/enable'),
  disable: () => api.post('/agent/disable'),
  triggerPublication: () => api.post('/agent/trigger/publication'),
  triggerEvenement: () => api.post('/agent/trigger/evenement'),
  triggerSuggestions: () => api.post('/agent/trigger/suggestions'),
  triggerVideo: () => api.post('/agent/trigger/video'),
  triggerMusique: () => api.post('/agent/trigger/musique'),
  triggerDiscovery: () => api.post('/agent/trigger/discovery'),
  sources: (params?: Record<string, unknown>) => api.get('/agent/sources', { params }),
  approveSource: (id: string) => api.post(`/agent/sources/${id}/approve`),
  ignoreSource: (id: string) => api.post(`/agent/sources/${id}/ignore`),
  approveAllSources: () => api.post('/agent/sources/approve-all'),
};
