import axios from 'axios';

export const BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://media.menorca1.com';
export const API = `${BASE}/api/v1`;

export const api = axios.create({ baseURL: API, timeout: 15000, withCredentials: false });

export const setToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface Media {
  friendly_token: string;
  url?: string;
  api_url?: string;
  user: string;
  title: string;
  description: string;
  media_type: 'video' | 'audio' | 'image';
  state: string;
  duration: number;
  thumbnail_url: string;
  poster_url?: string;
  preview_url: string | null;
  sprites_url?: string | null;
  author_name: string;
  author_profile: string;
  author_thumbnail: string;
  add_date: string;
  edit_date?: string;
  views: number;
  likes: number;
  dislikes: number;
  size: string;
  encoding_status: string;
  is_reviewed?: boolean;
  featured?: boolean;
  hls_info?: Record<string, string>;
  encodings_info?: Record<string, any>;
  original_media_url?: string;
  enable_comments?: boolean;
  allow_download?: boolean;
  related_media?: Media[];
  categories_info?: Category[];
  tags_info?: Tag[];
  subtitles_info?: any[];
  chapter_data?: any[];
}

export interface Category {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnail_url?: string;
  media_count?: number;
}

export interface Tag {
  id?: string;
  title: string;
}

export interface Comment {
  uid: string;
  text: string;
  add_date: string;
  author_name: string;
  author_thumbnail_url: string;
  author_profile: string;
  parent?: string | null;
}

export interface UserProfile {
  username: string;
  name: string;
  description: string;
  thumbnail_url: string;
  banner_thumbnail_url?: string;
  url: string;
  api_url: string;
  date_added: string;
  is_featured?: boolean;
  advancedUser?: boolean;
  is_editor?: boolean;
  is_manager?: boolean;
  edit_url?: string;
  media_info?: {
    results: Media[];
    user_media: string;
  };
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PLACEHOLDER = 'https://media.menorca1.com/media/userlogos/user.jpg';

export const fullUrl = (path: string, fallback = PLACEHOLDER): string => {
  if (!path) return fallback;
  return path.startsWith('http') ? path : `${BASE}${path}`;
};

export const getVideoUrl = (media: Media): string | null => {
  if (media.media_type !== 'video' && media.media_type !== 'audio') return null;
  if (media.hls_info?.master_file) return fullUrl(media.hls_info.master_file);
  const qualities = ['720', '480', '360', '240', '144'];
  for (const q of qualities) {
    const url = media.encodings_info?.[q]?.h264?.url;
    if (url) return fullUrl(url);
  }
  if (media.original_media_url) return fullUrl(media.original_media_url);
  return null;
};

export const formatDuration = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatViews = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginAndGetToken = async (username: string, password: string): Promise<string> => {
  // 1. Si ya hay sesión activa en el dispositivo, obtener el token directamente
  const existingRes = await fetch(`${API}/user/token`, {
    headers: { Accept: 'application/json' },
  }).catch(() => null);

  if (existingRes?.ok) {
    const existingData = await existingRes.json().catch(() => null);
    if (existingData?.token) return existingData.token as string;
  }

  // 2. Sin sesión: obtener CSRF del formulario de login
  const pageRes = await fetch(`${BASE}/accounts/login/`);
  const html = await pageRes.text();
  const csrf = html.match(/name="csrfmiddlewaretoken"[^>]*value="([^"]+)"/)?.[1];
  if (!csrf) throw new Error('Error del servidor al iniciar sesión');

  // 3. POST login
  const form = new FormData();
  form.append('login', username);
  form.append('password', password);
  form.append('csrfmiddlewaretoken', csrf);

  await fetch(`${BASE}/accounts/login/`, {
    method: 'POST',
    body: form,
    headers: { Referer: `${BASE}/accounts/login/` },
  });

  // 4. Obtener token con la nueva sesión
  const tokenRes = await fetch(`${API}/user/token`, {
    headers: { Accept: 'application/json' },
  });

  if (tokenRes.status === 403) throw new Error('Usuario o contraseña incorrectos');
  if (!tokenRes.ok) throw new Error('Error al obtener el token de autenticación');

  const data = await tokenRes.json();
  if (!data.token) throw new Error('Respuesta de autenticación inválida');
  return data.token as string;
};

// ── Media ─────────────────────────────────────────────────────────────────────

export const getMedia = (page = 1): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/media/', { params: { page, limit: 20 } }).then(r => r.data);

export const getFeaturedMedia = (page = 1): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/media/', { params: { page, featured: true } }).then(r => r.data);

export const getMediaDetail = (token: string): Promise<Media> =>
  api.get<Media>(`/media/${token}`).then(r => r.data);

export const searchMedia = (query: string, page = 1): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/media/', { params: { search: query, page } }).then(r => r.data);

export const getMediaByCategory = (categoryId: string, page = 1): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/media/', { params: { category: categoryId, page } }).then(r => r.data);

export const getUserMedia = (username: string, page = 1): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/media/', { params: { author: username, page } }).then(r => r.data);

export const deleteMedia = (token: string): Promise<void> =>
  api.delete(`/media/${token}`).then(() => undefined);

export const uploadMedia = async (
  file: { uri: string; name: string; type: string },
  title: string,
  description: string,
  authToken?: string | null,
): Promise<Media> => {
  const authHeader = authToken
    ? `Token ${authToken}`
    : (api.defaults.headers.common['Authorization'] as string);

  if (!authHeader) throw new Error('Sin permiso para subir. Verifica que estés autenticado.');

  const form = new FormData();
  form.append('media_file', { uri: file.uri, name: file.name, type: file.type } as any);
  form.append('title', title);
  if (description) form.append('description', description);

  const response = await fetch(`${API}/media/`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: form,
    credentials: 'omit',
  });

  if (response.status === 403) throw new Error('Sin permiso para subir. Verifica que estés autenticado.');
  if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

  return response.json();
};

// ── Categories & Tags ────────────────────────────────────────────────────────

export const getCategories = (): Promise<Paginated<Category>> =>
  api.get<Paginated<Category>>('/categories/').then(r => r.data);

// ── Comments ─────────────────────────────────────────────────────────────────

export const getComments = (token: string): Promise<Comment[]> =>
  api.get(`/media/${token}/comments`).then(r => {
    const d = r.data;
    return Array.isArray(d) ? d : (d?.results ?? []);
  });

export const postComment = (token: string, text: string): Promise<Comment> =>
  api.post<Comment>(`/media/${token}/comments`, { text }).then(r => r.data);

// ── Actions ───────────────────────────────────────────────────────────────────

export const likeMedia = (token: string): Promise<void> =>
  api.post(`/media/${token}/actions`, { type: 'like' }).then(() => undefined);

export const dislikeMedia = (token: string): Promise<void> =>
  api.post(`/media/${token}/actions`, { type: 'dislike' }).then(() => undefined);

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUserProfile = (username: string): Promise<UserProfile> =>
  api.get<UserProfile>(`/users/${username}`).then(r => r.data);

export const getWatchHistory = (): Promise<Paginated<Media>> =>
  api.get<Paginated<Media>>('/user/action/watch').then(r => r.data);

export const recordWatch = (token: string): Promise<void> =>
  api.post(`/media/${token}/actions`, { type: 'watch' }).then(() => undefined);
