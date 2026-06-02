const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const sessionStorageKey = "teladan_admin_session";

type StoredSession = {
  token: string;
  expiresAt: string;
};

function readStoredSession() {
  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as StoredSession;
    if (!session.token || !session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(sessionStorageKey);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function storeSession(token: string, expiresAt: string) {
  window.localStorage.setItem(sessionStorageKey, JSON.stringify({ token, expiresAt }));
}

function clearStoredSession() {
  window.localStorage.removeItem(sessionStorageKey);
}

async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const storedSession = readStoredSession();
  if (storedSession && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${storedSession.token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
    }
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AdminCertification = {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string | null;
  credentialUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  skills: string[];
};

export type AdminLiveSystem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  embedUrl?: string | null;
  isEmbeddable: boolean;
  isPublished: boolean;
  sortOrder: number;
};

export type AdminContactLink = {
  id: string;
  type: string;
  label: string;
  value?: string | null;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type AdminMediaAsset = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  altText?: string | null;
  caption?: string | null;
  createdAt: string;
};

export type AdminResumeVersion = {
  id: string;
  label: string;
  isActive: boolean;
  uploadedAt: string;
  notes?: string | null;
  mediaAsset?: AdminMediaAsset | null;
};

export type AdminMusicTrack = {
  id: string;
  title: string;
  artist: string;
  note: string;
  audioAssetId?: string | null;
  coverAssetId?: string | null;
  audioUrl?: string | null;
  audioOriginalName?: string | null;
  coverUrl?: string | null;
  coverOriginalName?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdminProject = {
  id: string;
  slug: string;
  title: string;
  ecosystem?: string | null;
  category: string;
  priority: string;
  summary: string;
  problem: string;
  solution: string;
  status: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  roles: string[];
  techStack: string[];
  learnings: string[];
  links: Record<string, string>;
  images: string[];
  mediaAssets: {
    id: string;
    kind: string;
    publicUrl: string;
    originalName: string;
    sortOrder: number;
  }[];
};

export type AdminExperience = {
  id: string;
  slug: string;
  title: string;
  organization: string;
  period: string;
  category: string;
  summary: string;
  reflection: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  responsibilities: string[];
  impact: string[];
  values: string[];
  images: string[];
  mediaAssets: {
    id: string;
    kind: string;
    publicUrl: string;
    originalName: string;
    sortOrder: number;
  }[];
};

export type AdminSiteBlock = {
  id: string;
  type: string;
  contentJson: unknown;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminSiteSection = {
  id: string;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  settingsJson?: unknown;
  sortOrder: number;
  isPublished: boolean;
  blocks: AdminSiteBlock[];
};

export type AdminSitePage = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  sections: AdminSiteSection[];
};

type CertificationPayload = {
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  credentialUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  skills: string[];
};

type LiveSystemPayload = {
  title: string;
  slug?: string;
  description: string;
  url: string;
  embedUrl?: string;
  isEmbeddable?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

type ContactPayload = {
  type: string;
  label: string;
  value?: string;
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

type ResumePayload = {
  label: string;
  mediaAssetId: string;
  notes?: string;
};

type ProjectPayload = {
  slug?: string;
  title: string;
  ecosystem?: string;
  category: string;
  priority: string;
  summary: string;
  problem: string;
  solution: string;
  status: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  roles: string[];
  techStack: string[];
  learnings: string[];
  demoUrl?: string;
  githubUrl?: string;
  downloadUrl?: string;
  coverMediaAssetId?: string;
  galleryMediaAssetIds?: string[];
};

type ExperiencePayload = {
  slug?: string;
  title: string;
  organization: string;
  period: string;
  category: string;
  summary: string;
  reflection: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  responsibilities: string[];
  impact: string[];
  values: string[];
  coverMediaAssetId?: string;
  galleryMediaAssetIds?: string[];
};

type MusicPayload = {
  title: string;
  artist: string;
  note: string;
  audioAssetId?: string;
  coverAssetId?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type PagePayload = {
  title: string;
  description?: string;
};

type PageSectionPayload = {
  title?: string;
  subtitle?: string;
  body?: string;
  settingsJson?: unknown;
  sortOrder?: number;
  isPublished?: boolean;
};

type ReorderPayload = {
  ids: string[];
};

export const adminApi = {
  health: () => request<{ ok: boolean; service: string; time: string }>("/api/health"),
  me: () => request<{ user: AdminUser }>("/api/admin/me"),
  login: async (email: string, password: string) => {
    const response = await request<{ sessionToken: string; sessionExpiresAt: string; user: AdminUser }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeSession(response.sessionToken, response.sessionExpiresAt);
    return { user: response.user };
  },
  logout: async () => {
    try {
      return await request<{ ok: boolean }>("/api/admin/auth/logout", { method: "POST" });
    } finally {
      clearStoredSession();
    }
  },
  certifications: () => request<{ data: AdminCertification[] }>("/api/admin/certifications"),
  createCertification: (payload: CertificationPayload) =>
    request<{ data: AdminCertification }>("/api/admin/certifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCertification: (id: string, payload: CertificationPayload) =>
    request<{ data: AdminCertification }>(`/api/admin/certifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCertification: (id: string) => request<{ ok: boolean }>(`/api/admin/certifications/${id}`, { method: "DELETE" }),
  reorderCertifications: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/certifications/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  systems: () => request<{ data: AdminLiveSystem[] }>("/api/admin/systems"),
  createSystem: (payload: LiveSystemPayload) =>
    request<{ data: AdminLiveSystem }>("/api/admin/systems", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSystem: (id: string, payload: LiveSystemPayload) =>
    request<{ data: AdminLiveSystem }>(`/api/admin/systems/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSystem: (id: string) => request<{ ok: boolean }>(`/api/admin/systems/${id}`, { method: "DELETE" }),
  reorderSystems: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/systems/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  contact: () => request<{ data: AdminContactLink[] }>("/api/admin/contact"),
  createContact: (payload: ContactPayload) =>
    request<{ data: AdminContactLink }>("/api/admin/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateContact: (id: string, payload: ContactPayload) =>
    request<{ data: AdminContactLink }>(`/api/admin/contact/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteContact: (id: string) => request<{ ok: boolean }>(`/api/admin/contact/${id}`, { method: "DELETE" }),
  reorderContact: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/contact/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  media: () => request<{ data: AdminMediaAsset[] }>("/api/admin/media"),
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ data: AdminMediaAsset }>("/api/admin/media", {
      method: "POST",
      body: formData,
    });
  },
  deleteMedia: (id: string) => request<{ ok: boolean }>(`/api/admin/media/${id}`, { method: "DELETE" }),
  resume: () => request<{ data: AdminResumeVersion[] }>("/api/admin/resume"),
  createResume: (payload: ResumePayload) =>
    request<{ data: AdminResumeVersion }>("/api/admin/resume", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  activateResume: (id: string) => request<{ data: AdminResumeVersion }>(`/api/admin/resume/${id}/activate`, { method: "PATCH" }),
  projects: () => request<{ data: AdminProject[] }>("/api/admin/projects"),
  createProject: (payload: ProjectPayload) =>
    request<{ data: AdminProject }>("/api/admin/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProject: (id: string, payload: ProjectPayload) =>
    request<{ data: AdminProject }>(`/api/admin/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteProject: (id: string) => request<{ ok: boolean }>(`/api/admin/projects/${id}`, { method: "DELETE" }),
  reorderProjects: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/projects/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  experiences: () => request<{ data: AdminExperience[] }>("/api/admin/experiences"),
  createExperience: (payload: ExperiencePayload) =>
    request<{ data: AdminExperience }>("/api/admin/experiences", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateExperience: (id: string, payload: ExperiencePayload) =>
    request<{ data: AdminExperience }>(`/api/admin/experiences/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteExperience: (id: string) => request<{ ok: boolean }>(`/api/admin/experiences/${id}`, { method: "DELETE" }),
  reorderExperiences: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/experiences/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  music: () => request<{ data: AdminMusicTrack[] }>("/api/admin/music"),
  createMusic: (payload: MusicPayload) =>
    request<{ data: AdminMusicTrack }>("/api/admin/music", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateMusic: (id: string, payload: MusicPayload) =>
    request<{ data: AdminMusicTrack }>(`/api/admin/music/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteMusic: (id: string) => request<{ ok: boolean }>(`/api/admin/music/${id}`, { method: "DELETE" }),
  reorderMusic: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/music/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  pages: () => request<{ data: AdminSitePage[] }>("/api/admin/pages"),
  page: (slug: string) => request<{ data: AdminSitePage }>(`/api/admin/pages/${slug}`),
  updatePage: (slug: string, payload: PagePayload) =>
    request<{ data: AdminSitePage }>(`/api/admin/pages/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updatePageSection: (slug: string, key: string, payload: PageSectionPayload) =>
    request<{ data: AdminSiteSection }>(`/api/admin/pages/${slug}/sections/${key}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
