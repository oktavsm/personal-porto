const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const sessionStorageKey = "teladan_admin_session";

type StoredSession = {
  token: string;
  expiresAt: string;
};

type AuthSessionResponse = {
  sessionToken: string;
  sessionExpiresAt: string;
  user: AdminUser;
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

export type AdminCoreServerNode = {
  id: string;
  label: string;
  description: string;
  href: string;
  positionX: number;
  positionY: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContentCategoryScope = "article" | "project" | "experience";

export type AdminContentCategory = {
  id: string;
  scope: ContentCategoryScope;
  label: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
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

export type AdminContextKind = "portfolio" | "article";

export type AdminContextDocument = {
  kind: AdminContextKind;
  label: string;
  generatedMarkdown: string;
  manualMarkdown: string;
  mode: "append" | "override";
  finalMarkdown: string;
  updatedAt?: string | null;
};

export type AdminContexts = {
  portfolio: AdminContextDocument;
  article: AdminContextDocument;
};

export type AdminAuditLog = {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: unknown;
  createdAt: string;
};

export type AdminBackupSummary = {
  schemaVersion: number;
  exportedAt: string;
  counts: Record<string, number>;
  warnings: string[];
  imported?: Record<string, number>;
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

type CoreNodePayload = {
  label: string;
  description: string;
  href: string;
  positionX?: number;
  positionY?: number;
  isPublished?: boolean;
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

type PageBlockPayload = {
  type: string;
  contentJson: unknown;
  sortOrder?: number;
  isPublished?: boolean;
};

type ArticleGenerateDraftPayload = {
  topic?: string;
  rawNotes: string;
  category: string;
  tone?: string;
  language?: string;
  targetLength?: string;
  sourceContext?: string;
  articleContext?: string;
  mediaAssetIds?: string[];
  mediaContext?: Record<string, string>;
};

type ReorderPayload = {
  ids: string[];
};

type CategoryPayload = {
  scope: ContentCategoryScope;
  label: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export const adminApi = {
  health: () => request<{ ok: boolean; service: string; time: string }>("/api/health"),
  me: () => request<{ user: AdminUser }>("/api/admin/me"),
  login: async (email: string, password: string) => {
    const response = await request<AuthSessionResponse>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeSession(response.sessionToken, response.sessionExpiresAt);
    return { user: response.user };
  },
  changePassword: async (email: string, currentPassword: string, newPassword: string) => {
    const response = await request<AuthSessionResponse>("/api/admin/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ email, currentPassword, newPassword }),
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
  categories: (scope?: ContentCategoryScope) =>
    request<{ data: AdminContentCategory[] }>(`/api/admin/categories${scope ? `?scope=${encodeURIComponent(scope)}` : ""}`),
  createCategory: (payload: CategoryPayload) =>
    request<{ data: AdminContentCategory }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCategory: (id: string, payload: CategoryPayload) =>
    request<{ data: AdminContentCategory }>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: string) => request<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE" }),
  reorderCategories: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/categories/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  media: () => request<{ data: AdminMediaAsset[] }>("/api/admin/media"),
  uploadMedia: (file: File) => adminApi.uploadMediaBatch([file]).then(({ data }) => ({ data: data[0] })),
  uploadMediaBatch: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request<{ data: AdminMediaAsset[] }>("/api/admin/media", {
      method: "POST",
      body: formData,
    });
  },
  deleteMedia: (id: string) => request<{ ok: boolean }>(`/api/admin/media/${id}`, { method: "DELETE" }),
  updateMedia: (id: string, payload: { altText?: string; caption?: string }) =>
    request<{ data: AdminMediaAsset }>(`/api/admin/media/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
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
  coreNodes: () => request<{ data: AdminCoreServerNode[] }>("/api/admin/core-nodes"),
  createCoreNode: (payload: CoreNodePayload) =>
    request<{ data: AdminCoreServerNode }>("/api/admin/core-nodes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCoreNode: (id: string, payload: Partial<CoreNodePayload>) =>
    request<{ data: AdminCoreServerNode }>(`/api/admin/core-nodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCoreNode: (id: string) => request<{ ok: boolean }>(`/api/admin/core-nodes/${id}`, { method: "DELETE" }),
  reorderCoreNodes: (payload: ReorderPayload) =>
    request<{ ok: boolean }>("/api/admin/core-nodes/reorder", {
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
  createPageBlock: (slug: string, key: string, payload: PageBlockPayload) =>
    request<{ data: AdminSiteBlock }>(`/api/admin/pages/${slug}/sections/${key}/blocks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePageBlock: (slug: string, key: string, blockId: string, payload: PageBlockPayload) =>
    request<{ data: AdminSiteBlock }>(`/api/admin/pages/${slug}/sections/${key}/blocks/${blockId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deletePageBlock: (slug: string, key: string, blockId: string) => request<{ ok: boolean }>(`/api/admin/pages/${slug}/sections/${key}/blocks/${blockId}`, { method: "DELETE" }),
  reorderPageBlocks: (slug: string, key: string, payload: ReorderPayload) =>
    request<{ ok: boolean }>(`/api/admin/pages/${slug}/sections/${key}/blocks/reorder`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ─── Article Studio ─────────────────────────────────────────────────────────

  articles: (params?: { status?: string; category?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][]).toString()
      : "";
    return request<{ data: AdminArticle[] }>(`/api/admin/articles${qs}`);
  },
  article: (id: string) => request<{ data: AdminArticle }>(`/api/admin/articles/${id}`),
  createArticle: (payload: ArticlePayload) =>
    request<{ data: AdminArticle }>("/api/admin/articles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateArticle: (id: string, payload: ArticlePayload) =>
    request<{ data: AdminArticle }>(`/api/admin/articles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteArticle: (id: string) => request<{ ok: boolean }>(`/api/admin/articles/${id}`, { method: "DELETE" }),
  publishArticle: (id: string) =>
    request<{ data: AdminArticle }>(`/api/admin/articles/${id}/publish`, { method: "POST" }),
  unpublishArticle: (id: string) =>
    request<{ data: AdminArticle }>(`/api/admin/articles/${id}/unpublish`, { method: "POST" }),
  duplicateArticle: (id: string) =>
    request<{ data: AdminArticle }>(`/api/admin/articles/${id}/duplicate`, { method: "POST" }),
  generateArticleDraft: (payload: ArticleGenerateDraftPayload) =>
    request<{ data: AdminArticle }>("/api/admin/articles/generate-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ─── Theme Studio ────────────────────────────────────────────────────────────

  getTheme: () => request<{ data: AdminTheme; defaults: AdminTheme }>("/api/public/theme"),
  saveTheme: (payload: AdminTheme) =>
    request<{ data: AdminTheme }>("/api/admin/theme", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  resetTheme: () => request<{ data: AdminTheme }>("/api/admin/theme/reset", { method: "POST" }),
  contexts: () => request<{ data: AdminContexts }>("/api/admin/contexts"),
  updateContext: (kind: AdminContextKind, payload: { manualMarkdown: string; mode: "append" | "override" }) =>
    request<{ data: AdminContextDocument }>(`/api/admin/contexts/${kind}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  auditLogs: (params?: { entityType?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.entityType) searchParams.set("entityType", params.entityType);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return request<{ data: AdminAuditLog[] }>(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);
  },
  previewImportBackup: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ data: AdminBackupSummary }>("/api/admin/import/preview", {
      method: "POST",
      body: formData,
    });
  },
  importBackup: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ data: AdminBackupSummary }>("/api/admin/import", {
      method: "POST",
      body: formData,
    });
  },
};

// ─── Article Studio Types ─────────────────────────────────────────────────────

export type AdminArticleBlock = {
  id: string;
  type: string;
  contentJson: unknown;
  sortOrder: number;
};

export type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  category: string;
  status: string;
  isFeatured: boolean;
  coverAssetId?: string | null;
  coverImage?: string | null;
  coverAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  generatorMeta?: unknown;
  language: string;
  author: { name: string; role?: string | null };
  tags: string[];
  blocks: AdminArticleBlock[];
  readingTime: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTheme = Record<string, string>;

type ArticlePayload = {
  slug?: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  status?: string;
  isFeatured?: boolean;
  coverAssetId?: string;
  seoTitle?: string;
  seoDescription?: string;
  authorName?: string;
  authorRole?: string;
  tags?: string[];
  blocks?: {
    type: string;
    contentJson: unknown;
    sortOrder?: number;
  }[];
};
