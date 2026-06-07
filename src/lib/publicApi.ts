const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

async function request<T>(path: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type PublicCertification = {
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

export type PublicLiveSystem = {
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

export type PublicContactLink = {
  id: string;
  type: string;
  label: string;
  value?: string | null;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type PublicResume = {
  id: string;
  label: string;
  isActive: boolean;
  notes?: string | null;
  mediaAsset?: {
    publicUrl: string;
    originalName: string;
  } | null;
};

export type PublicProject = {
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
};

export type PublicExperience = {
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
};

export type PublicMusicTrack = {
  id: string;
  title: string;
  artist: string;
  note: string;
  audioUrl?: string | null;
  coverUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PublicContentCategory = {
  id: string;
  scope: string;
  label: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
};

export type PublicCoreServerNode = {
  id: string;
  label: string;
  description: string;
  href: string;
  positionX: number;
  positionY: number;
  sortOrder: number;
  isPublished: boolean;
};

export type PublicSiteBlock = {
  id: string;
  type: string;
  contentJson: unknown;
  sortOrder: number;
  isPublished: boolean;
};

export type PublicSiteSection = {
  id: string;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  settingsJson?: unknown;
  sortOrder: number;
  isPublished: boolean;
  blocks: PublicSiteBlock[];
};

export type PublicSitePage = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sections: PublicSiteSection[];
};

export const publicApi = {
  certifications: () => request<{ data: PublicCertification[] }>("/api/public/certifications"),
  systems: () => request<{ data: PublicLiveSystem[] }>("/api/public/systems"),
  contact: () => request<{ data: PublicContactLink[] }>("/api/public/contact"),
  resume: () => request<{ data: PublicResume | null }>("/api/public/resume"),
  projects: () => request<{ data: PublicProject[] }>("/api/public/projects"),
  project: (slug: string) => request<{ data: PublicProject }>(`/api/public/projects/${slug}`),
  experiences: () => request<{ data: PublicExperience[] }>("/api/public/experiences"),
  experience: (slug: string) => request<{ data: PublicExperience }>(`/api/public/experiences/${slug}`),
  music: () => request<{ data: PublicMusicTrack[] }>("/api/public/music"),
  categories: (scope: "article" | "project" | "experience") =>
    request<{ data: PublicContentCategory[] }>(`/api/public/categories?scope=${encodeURIComponent(scope)}`),
  page: (slug: string) => request<{ data: PublicSitePage }>(`/api/public/pages/${slug}`),
  // Article Studio
  articles: (params?: { category?: string; tag?: string; featured?: string; limit?: string }) => {
    const qs = params
      ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => Boolean(v)) as [string, string][]).toString()
      : "";
    return request<{ data: PublicArticle[] }>(`/api/public/articles${qs}`);
  },
  article: (slug: string) => request<{ data: PublicArticle }>(`/api/public/articles/${slug}`),
  // Theme Studio
  theme: () => request<{ data: PublicTheme; defaults: PublicTheme }>("/api/public/theme"),
  coreNodes: () => request<{ data: PublicCoreServerNode[] }>("/api/public/core-nodes"),
};

// ─── Article & Theme Types ────────────────────────────────────────────────────

export type PublicArticleBlock = {
  id: string;
  type: string;
  contentJson: unknown;
  sortOrder: number;
};

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  category: string;
  status: string;
  isFeatured: boolean;
  coverImage?: string | null;
  coverAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  language: string;
  author: { name: string; role?: string | null };
  tags: string[];
  blocks: PublicArticleBlock[];
  readingTime: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicTheme = Record<string, string>;
