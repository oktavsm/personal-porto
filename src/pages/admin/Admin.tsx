import { ArrowDown, ArrowUp, CheckCircle, ExternalLink, FileText, LogOut, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  adminApi,
  type AdminCertification,
  type AdminContactLink,
  type AdminExperience,
  type AdminLiveSystem,
  type AdminMediaAsset,
  type AdminMusicTrack,
  type AdminProject,
  type AdminResumeVersion,
  type AdminUser,
} from "../../lib/adminApi";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

type AdminState = {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
};

type DeleteTarget =
  | { type: "certification"; id: string; label: string }
  | { type: "system"; id: string; label: string }
  | { type: "contact"; id: string; label: string }
  | { type: "media"; id: string; label: string }
  | { type: "project"; id: string; label: string }
  | { type: "experience"; id: string; label: string }
  | { type: "music"; id: string; label: string };

type AdminTab = "overview" | "projects" | "experiences" | "music" | "resume-media" | "certifications" | "systems" | "contacts";

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "experiences", label: "Experiences" },
  { id: "music", label: "Music" },
  { id: "resume-media", label: "Resume & Media" },
  { id: "certifications", label: "Certifications" },
  { id: "systems", label: "Systems" },
  { id: "contacts", label: "Contacts" },
];

const emptyCertification = {
  title: "",
  issuer: "",
  issuedAt: "",
  expiresAt: "",
  credentialUrl: "",
  skills: "",
  isFeatured: false,
  sortOrder: 0,
};

const emptySystem = {
  title: "",
  description: "",
  url: "",
  embedUrl: "",
  isEmbeddable: true,
  isPublished: true,
  sortOrder: 0,
};

const emptyContact = {
  type: "email",
  label: "",
  value: "",
  url: "",
  isPrimary: false,
  sortOrder: 0,
};

const emptyResumeForm = {
  label: "",
  notes: "",
};

const emptyProject = {
  title: "",
  slug: "",
  ecosystem: "",
  category: "Web",
  priority: "Featured",
  summary: "",
  problem: "",
  solution: "",
  status: "In Development",
  roles: "",
  techStack: "",
  learnings: "",
  demoUrl: "",
  githubUrl: "",
  downloadUrl: "",
  coverMediaAssetId: "",
  galleryMediaAssetIds: [] as string[],
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

const emptyExperience = {
  title: "",
  slug: "",
  organization: "",
  period: "",
  category: "Community",
  summary: "",
  responsibilities: "",
  impact: "",
  reflection: "",
  values: "",
  coverMediaAssetId: "",
  galleryMediaAssetIds: [] as string[],
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

const emptyMusic = {
  title: "",
  artist: "",
  note: "",
  audioAssetId: "",
  coverAssetId: "",
  isActive: true,
  sortOrder: 0,
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function moveId<T extends { id: string }>(items: T[], id: string, direction: "up" | "down") {
  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex < 0) return null;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return null;

  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(targetIndex, 0, item);
  return nextItems;
}

function DeleteConfirmModal({
  target,
  saving,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <div className="section-kicker">Confirm Delete</div>
        <h3 id="delete-dialog-title">Remove this item?</h3>
        <p>
          You are about to remove <strong>{target.label}</strong>. This action will update the public portfolio data.
        </p>
        <div className="actions">
          <button className="btn" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary danger-action" type="button" onClick={onConfirm} disabled={saving}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MediaSelectionPreview({
  asset,
  onClear,
}: {
  asset?: AdminMediaAsset;
  onClear: () => void;
}) {
  if (!asset) return null;

  return (
    <div className="admin-media-preview">
      {asset.mimeType.startsWith("image/") ? <img src={asset.publicUrl} alt={asset.originalName} /> : <FileText size={18} />}
      <span>{asset.originalName}</span>
      <button className="icon-btn" type="button" aria-label={`Clear ${asset.originalName}`} onClick={onClear}>
        <X size={14} />
      </button>
    </div>
  );
}

export function Admin() {
  const [state, setState] = useState<AdminState>({ user: null, loading: true, error: null });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [certifications, setCertifications] = useState<AdminCertification[]>([]);
  const [systems, setSystems] = useState<AdminLiveSystem[]>([]);
  const [contacts, setContacts] = useState<AdminContactLink[]>([]);
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAsset[]>([]);
  const [resumeVersions, setResumeVersions] = useState<AdminResumeVersion[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [musicTracks, setMusicTracks] = useState<AdminMusicTrack[]>([]);
  const [certForm, setCertForm] = useState(emptyCertification);
  const [systemForm, setSystemForm] = useState(emptySystem);
  const [contactForm, setContactForm] = useState(emptyContact);
  const [resumeForm, setResumeForm] = useState(emptyResumeForm);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [musicForm, setMusicForm] = useState(emptyMusic);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mediaSearch, setMediaSearch] = useState("");
  const imageMediaAssets = useMemo(() => mediaAssets.filter((asset) => asset.mimeType.startsWith("image/")), [mediaAssets]);
  const audioMediaAssets = useMemo(() => mediaAssets.filter((asset) => asset.mimeType.startsWith("audio/")), [mediaAssets]);
  const filteredImageMediaAssets = useMemo(
    () => imageMediaAssets.filter((asset) => asset.originalName.toLowerCase().includes(mediaSearch.toLowerCase().trim())),
    [imageMediaAssets, mediaSearch],
  );
  const filteredAudioMediaAssets = useMemo(
    () => audioMediaAssets.filter((asset) => asset.originalName.toLowerCase().includes(mediaSearch.toLowerCase().trim())),
    [audioMediaAssets, mediaSearch],
  );
  const mediaById = useMemo(() => new Map(mediaAssets.map((asset) => [asset.id, asset])), [mediaAssets]);

  async function loadAdminData() {
    const [certificationResponse, systemResponse, contactResponse, mediaResponse, resumeResponse, projectResponse, experienceResponse, musicResponse] = await Promise.allSettled([
      adminApi.certifications(),
      adminApi.systems(),
      adminApi.contact(),
      adminApi.media(),
      adminApi.resume(),
      adminApi.projects(),
      adminApi.experiences(),
      adminApi.music(),
    ]);

    if (certificationResponse.status === "fulfilled") setCertifications(certificationResponse.value.data);
    if (systemResponse.status === "fulfilled") setSystems(systemResponse.value.data);
    if (contactResponse.status === "fulfilled") setContacts(contactResponse.value.data);
    if (mediaResponse.status === "fulfilled") setMediaAssets(mediaResponse.value.data);
    if (resumeResponse.status === "fulfilled") setResumeVersions(resumeResponse.value.data);
    if (projectResponse.status === "fulfilled") setProjects(projectResponse.value.data);
    if (experienceResponse.status === "fulfilled") setExperiences(experienceResponse.value.data);
    if (musicResponse.status === "fulfilled") setMusicTracks(musicResponse.value.data);

    const failures = [certificationResponse, systemResponse, contactResponse, mediaResponse, resumeResponse, projectResponse, experienceResponse, musicResponse].filter(
      (response) => response.status === "rejected",
    );
    if (failures.length > 0) {
      setNotice("Some admin data could not be loaded. Try refresh data.");
    }
  }

  useEffect(() => {
    adminApi
      .me()
      .then(({ user }) => {
        setState({ user, loading: false, error: null });
        void loadAdminData();
      })
      .catch(() => setState({ user: null, loading: false, error: null }));
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const { user } = await adminApi.login(email, password);
      setState({ user, loading: false, error: null });
      void loadAdminData();
    } catch (error) {
      setState({ user: null, loading: false, error: error instanceof Error ? error.message : "Login failed" });
    }
  }

  async function handleLogout() {
    await adminApi.logout().catch(() => undefined);
    setState({ user: null, loading: false, error: null });
    setCertifications([]);
    setSystems([]);
    setContacts([]);
    setMediaAssets([]);
    setResumeVersions([]);
    setProjects([]);
    setExperiences([]);
    setMusicTracks([]);
  }

  async function handleCreateCertification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const payload = {
        ...certForm,
        skills: certForm.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      };
      if (editingCertificationId) {
        await adminApi.updateCertification(editingCertificationId, payload);
      } else {
        await adminApi.createCertification(payload);
      }
      resetCertificationForm();
      await loadAdminData();
      setNotice(editingCertificationId ? "Certification updated." : "Certification added.");
      setEditingCertificationId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save certification.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingSystemId) {
        await adminApi.updateSystem(editingSystemId, systemForm);
      } else {
        await adminApi.createSystem(systemForm);
      }
      resetSystemForm();
      await loadAdminData();
      setNotice(editingSystemId ? "Live system updated." : "Live system added.");
      setEditingSystemId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save live system.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      if (editingContactId) {
        await adminApi.updateContact(editingContactId, contactForm);
      } else {
        await adminApi.createContact(contactForm);
      }
      resetContactForm();
      await loadAdminData();
      setNotice(editingContactId ? "Contact link updated." : "Contact link added.");
      setEditingContactId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save contact link.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const payload = {
        ...projectForm,
        roles: projectForm.roles.split(",").map((item) => item.trim()).filter(Boolean),
        techStack: projectForm.techStack.split(",").map((item) => item.trim()).filter(Boolean),
        learnings: projectForm.learnings.split(",").map((item) => item.trim()).filter(Boolean),
        galleryMediaAssetIds: projectForm.galleryMediaAssetIds,
      };
      if (editingProjectId) {
        await adminApi.updateProject(editingProjectId, payload);
      } else {
        await adminApi.createProject(payload);
      }
      resetProjectForm();
      await loadAdminData();
      setNotice(editingProjectId ? "Project updated." : "Project added.");
      setEditingProjectId(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const wasEditing = Boolean(editingExperienceId);
      const payload = {
        ...experienceForm,
        responsibilities: experienceForm.responsibilities.split(",").map((item) => item.trim()).filter(Boolean),
        impact: experienceForm.impact.split(",").map((item) => item.trim()).filter(Boolean),
        values: experienceForm.values.split(",").map((item) => item.trim()).filter(Boolean),
        galleryMediaAssetIds: experienceForm.galleryMediaAssetIds,
      };
      if (editingExperienceId) {
        await adminApi.updateExperience(editingExperienceId, payload);
      } else {
        await adminApi.createExperience(payload);
      }
      resetExperienceForm();
      await loadAdminData();
      setNotice(wasEditing ? "Experience updated." : "Experience added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save experience.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateMusic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      setNotice(null);
      const wasEditing = Boolean(editingMusicId);
      if (editingMusicId) {
        await adminApi.updateMusic(editingMusicId, musicForm);
      } else {
        await adminApi.createMusic(musicForm);
      }
      resetMusicForm();
      await loadAdminData();
      setNotice(wasEditing ? "Music track updated." : "Music track added.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save music track.");
    } finally {
      setSaving(false);
    }
  }


  async function handleUploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mediaFile) {
      setNotice("Choose a file first.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const upload = await adminApi.uploadMedia(mediaFile);
      setMediaAssets((current) => [upload.data, ...current.filter((asset) => asset.id !== upload.data.id)]);
      setMediaFile(null);
      event.currentTarget.reset();
      void loadAdminData();
      setNotice("Media uploaded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to upload media.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeFile) {
      setNotice("Choose a CV PDF first.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const media = await adminApi.uploadMedia(resumeFile);
      const resume = await adminApi.createResume({
        label: resumeForm.label || resumeFile.name,
        notes: resumeForm.notes,
        mediaAssetId: media.data.id,
      });
      const activated = await adminApi.activateResume(resume.data.id);
      setMediaAssets((current) => [media.data, ...current.filter((asset) => asset.id !== media.data.id)]);
      setResumeVersions((current) => [
        activated.data,
        ...current.filter((version) => version.id !== activated.data.id).map((version) => ({ ...version, isActive: false })),
      ]);
      setResumeFile(null);
      setResumeForm(emptyResumeForm);
      event.currentTarget.reset();
      void loadAdminData();
      setNotice("Resume uploaded and activated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to create resume version.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivateResume(id: string) {
    setSaving(true);
    setNotice(null);
    try {
      const resume = await adminApi.activateResume(id);
      setResumeVersions((current) => current.map((version) => (version.id === id ? resume.data : { ...version, isActive: false })));
      void loadAdminData();
      setNotice("Resume activated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to activate resume.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderProjects(id: string, direction: "up" | "down") {
    const nextItems = moveId(projects, id, direction);
    if (!nextItems) return;
    setProjects(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderProjects({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder projects.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderExperiences(id: string, direction: "up" | "down") {
    const nextItems = moveId(experiences, id, direction);
    if (!nextItems) return;
    setExperiences(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderExperiences({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder experiences.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderMusic(id: string, direction: "up" | "down") {
    const nextItems = moveId(musicTracks, id, direction);
    if (!nextItems) return;
    setMusicTracks(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderMusic({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder music tracks.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderCertifications(id: string, direction: "up" | "down") {
    const nextItems = moveId(certifications, id, direction);
    if (!nextItems) return;
    setCertifications(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderCertifications({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder certifications.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderSystems(id: string, direction: "up" | "down") {
    const nextItems = moveId(systems, id, direction);
    if (!nextItems) return;
    setSystems(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderSystems({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder systems.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  async function handleReorderContact(id: string, direction: "up" | "down") {
    const nextItems = moveId(contacts, id, direction);
    if (!nextItems) return;
    setContacts(nextItems);
    setSaving(true);
    try {
      await adminApi.reorderContact({ ids: nextItems.map((item) => item.id) });
      await loadAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to reorder contact links.");
      await loadAdminData();
    } finally {
      setSaving(false);
    }
  }

  function resetCertificationForm() {
    setCertForm(emptyCertification);
    setEditingCertificationId(null);
  }

  function resetSystemForm() {
    setSystemForm(emptySystem);
    setEditingSystemId(null);
  }

  function resetContactForm() {
    setContactForm(emptyContact);
    setEditingContactId(null);
  }

  function resetProjectForm() {
    setProjectForm(emptyProject);
    setEditingProjectId(null);
  }

  function resetExperienceForm() {
    setExperienceForm(emptyExperience);
    setEditingExperienceId(null);
  }

  function resetMusicForm() {
    setMusicForm(emptyMusic);
    setEditingMusicId(null);
  }

  function editCertification(certification: AdminCertification) {
    setActiveTab("certifications");
    setEditingCertificationId(certification.id);
    setCertForm({
      title: certification.title,
      issuer: certification.issuer,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt ?? "",
      credentialUrl: certification.credentialUrl ?? "",
      skills: certification.skills.join(", "),
      isFeatured: certification.isFeatured,
      sortOrder: certification.sortOrder,
    });
  }

  function editSystem(system: AdminLiveSystem) {
    setActiveTab("systems");
    setEditingSystemId(system.id);
    setSystemForm({
      title: system.title,
      description: system.description,
      url: system.url,
      embedUrl: system.embedUrl ?? "",
      isEmbeddable: system.isEmbeddable,
      isPublished: system.isPublished,
      sortOrder: system.sortOrder,
    });
  }

  function editContact(contact: AdminContactLink) {
    setActiveTab("contacts");
    setEditingContactId(contact.id);
    setContactForm({
      type: contact.type,
      label: contact.label,
      value: contact.value ?? "",
      url: contact.url,
      isPrimary: contact.isPrimary,
      sortOrder: contact.sortOrder,
    });
  }

  function editProject(project: AdminProject) {
    setActiveTab("projects");
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title,
      slug: project.slug,
      ecosystem: project.ecosystem ?? "",
      category: project.category,
      priority: project.priority,
      summary: project.summary,
      problem: project.problem,
      solution: project.solution,
      status: project.status,
      roles: project.roles.join(", "),
      techStack: project.techStack.join(", "),
      learnings: project.learnings.join(", "),
      demoUrl: project.links.demo ?? "",
      githubUrl: project.links.github ?? "",
      downloadUrl: project.links.download ?? "",
      coverMediaAssetId: project.mediaAssets.find((asset) => asset.kind === "cover")?.id ?? "",
      galleryMediaAssetIds: project.mediaAssets.filter((asset) => asset.kind !== "cover").map((asset) => asset.id),
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
      sortOrder: project.sortOrder,
    });
  }

  function editExperience(experience: AdminExperience) {
    setActiveTab("experiences");
    setEditingExperienceId(experience.id);
    setExperienceForm({
      title: experience.title,
      slug: experience.slug,
      organization: experience.organization,
      period: experience.period,
      category: experience.category,
      summary: experience.summary,
      responsibilities: experience.responsibilities.join(", "),
      impact: experience.impact.join(", "),
      reflection: experience.reflection,
      values: experience.values.join(", "),
      coverMediaAssetId: experience.mediaAssets.find((asset) => asset.kind === "cover")?.id ?? "",
      galleryMediaAssetIds: experience.mediaAssets.filter((asset) => asset.kind !== "cover").map((asset) => asset.id),
      isFeatured: experience.isFeatured,
      isPublished: experience.isPublished,
      sortOrder: experience.sortOrder,
    });
  }

  function editMusic(track: AdminMusicTrack) {
    setActiveTab("music");
    setEditingMusicId(track.id);
    setMusicForm({
      title: track.title,
      artist: track.artist,
      note: track.note,
      audioAssetId: track.audioAssetId ?? "",
      coverAssetId: track.coverAssetId ?? "",
      isActive: track.isActive,
      sortOrder: track.sortOrder,
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setNotice(null);
    try {
      if (deleteTarget.type === "certification") await adminApi.deleteCertification(deleteTarget.id);
      if (deleteTarget.type === "system") await adminApi.deleteSystem(deleteTarget.id);
      if (deleteTarget.type === "contact") await adminApi.deleteContact(deleteTarget.id);
      if (deleteTarget.type === "media") await adminApi.deleteMedia(deleteTarget.id);
      if (deleteTarget.type === "project") await adminApi.deleteProject(deleteTarget.id);
      if (deleteTarget.type === "experience") await adminApi.deleteExperience(deleteTarget.id);
      if (deleteTarget.type === "music") await adminApi.deleteMusic(deleteTarget.id);
      setDeleteTarget(null);
      await loadAdminData();
      setNotice(`${deleteTarget.label} removed.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to delete item.");
    } finally {
      setSaving(false);
    }
  }

  if (state.loading) {
    return (
      <section className="page-section admin-page">
        <div className="container">
          <Card>Loading admin...</Card>
        </div>
      </section>
    );
  }

  if (!state.user) {
    return (
      <section className="page-section admin-page">
        <div className="container admin-auth">
          <Card>
            <div className="section-kicker">Admin</div>
            <h1>Portfolio control room</h1>
            <p>Login to manage portfolio content, resume, certifications, live systems, and future CMS sections.</p>
            <form className="admin-form" onSubmit={handleLogin}>
              <label>
                Email
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
              </label>
              <label>
                Password
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
              </label>
              {state.error ? <p className="admin-error">{state.error}</p> : null}
              <button className="btn btn-primary" type="submit">
                <ShieldCheck size={16} /> Login
              </button>
            </form>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section admin-page" data-admin-tab={activeTab}>
      <div className="container">
        <div className="admin-head">
          <div>
            <div className="section-kicker">Admin Dashboard</div>
            <h1>Content ops</h1>
            <p>Logged in as {state.user.email}. Manage fast-changing portfolio content from one private surface.</p>
            {notice ? <p className="admin-notice">{notice}</p> : null}
          </div>
          <div className="actions">
            <button className="btn" type="button" onClick={() => void loadAdminData()}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn" type="button" onClick={() => void handleLogout()}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {adminTabs.map((tab) => (
            <button
              className={activeTab === tab.id ? "is-active" : ""}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-stats" aria-label="Admin content summary">
          <div className="admin-stat">
            <span>Certifications</span>
            <strong>{certifications.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Live Systems</span>
            <strong>{systems.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Contact Links</span>
            <strong>{contacts.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Media Assets</span>
            <strong>{mediaAssets.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Projects</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Experiences</span>
            <strong>{experiences.length}</strong>
          </div>
          <div className="admin-stat">
            <span>Music Tracks</span>
            <strong>{musicTracks.length}</strong>
          </div>
        </div>

        <div className="admin-grid">
          <Card className="admin-card-projects">
            <div className="admin-card-head">
              <h3>{editingProjectId ? "Edit project" : "New project"}</h3>
              {editingProjectId ? (
                <button className="icon-btn" type="button" aria-label="Cancel project edit" onClick={resetProjectForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateProject}>
              <label>
                Title
                <input value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} required />
              </label>
              <label>
                Slug
                <input value={projectForm.slug} onChange={(event) => setProjectForm({ ...projectForm, slug: event.target.value })} placeholder="auto from title if empty" />
              </label>
              <div className="admin-form-pair">
                <label>
                  Category
                  <select value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })}>
                    <option>Android</option>
                    <option>Web</option>
                    <option>Automation</option>
                    <option>AI</option>
                    <option>Networking</option>
                    <option>Academic</option>
                    <option>Utility</option>
                  </select>
                </label>
                <label>
                  Priority
                  <select value={projectForm.priority} onChange={(event) => setProjectForm({ ...projectForm, priority: event.target.value })}>
                    <option>Flagship</option>
                    <option>Featured</option>
                    <option>Archive</option>
                  </select>
                </label>
              </div>
              <label>
                Status
                <select value={projectForm.status} onChange={(event) => setProjectForm({ ...projectForm, status: event.target.value })}>
                  <option>Deployed</option>
                  <option>In Development</option>
                  <option>Prototype</option>
                  <option>Paused</option>
                  <option>Archived</option>
                </select>
              </label>
              <label>
                Display Order
                <input value={projectForm.sortOrder} onChange={(event) => setProjectForm({ ...projectForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Summary
                <textarea value={projectForm.summary} onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })} required />
              </label>
              <label>
                Problem
                <textarea value={projectForm.problem} onChange={(event) => setProjectForm({ ...projectForm, problem: event.target.value })} required />
              </label>
              <label>
                Solution
                <textarea value={projectForm.solution} onChange={(event) => setProjectForm({ ...projectForm, solution: event.target.value })} required />
              </label>
              <label>
                Roles
                <input value={projectForm.roles} onChange={(event) => setProjectForm({ ...projectForm, roles: event.target.value })} placeholder="Developer, Designer" />
              </label>
              <label>
                Tech Stack
                <input value={projectForm.techStack} onChange={(event) => setProjectForm({ ...projectForm, techStack: event.target.value })} placeholder="React, Vite, Docker" />
              </label>
              <label>
                Learnings
                <input value={projectForm.learnings} onChange={(event) => setProjectForm({ ...projectForm, learnings: event.target.value })} placeholder="Automation, Deployment" />
              </label>
              <label>
                Demo URL
                <input value={projectForm.demoUrl} onChange={(event) => setProjectForm({ ...projectForm, demoUrl: event.target.value })} />
              </label>
              <label>
                GitHub URL
                <input value={projectForm.githubUrl} onChange={(event) => setProjectForm({ ...projectForm, githubUrl: event.target.value })} />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search uploaded images" />
              </label>
              <label>
                Cover Image
                <select value={projectForm.coverMediaAssetId} onChange={(event) => setProjectForm({ ...projectForm, coverMediaAssetId: event.target.value })}>
                  <option value="">Use fallback or no cover</option>
                  {filteredImageMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
              </label>
              <MediaSelectionPreview asset={mediaById.get(projectForm.coverMediaAssetId)} onClear={() => setProjectForm({ ...projectForm, coverMediaAssetId: "" })} />
              <label>
                Gallery Images
                <select
                  multiple
                  value={projectForm.galleryMediaAssetIds}
                  onChange={(event) =>
                    setProjectForm({
                      ...projectForm,
                      galleryMediaAssetIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                    })
                  }
                >
                  {filteredImageMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
                <span className="admin-help">Hold Ctrl or Shift to select multiple gallery images.</span>
              </label>
              {projectForm.galleryMediaAssetIds.length > 0 ? (
                <div className="admin-selected-media-grid">
                  {projectForm.galleryMediaAssetIds.map((id) => (
                    <MediaSelectionPreview
                      asset={mediaById.get(id)}
                      key={id}
                      onClear={() => setProjectForm({ ...projectForm, galleryMediaAssetIds: projectForm.galleryMediaAssetIds.filter((assetId) => assetId !== id) })}
                    />
                  ))}
                </div>
              ) : null}
              <label className="admin-check">
                <input checked={projectForm.isFeatured} onChange={(event) => setProjectForm({ ...projectForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured on home
              </label>
              <label className="admin-check">
                <input checked={projectForm.isPublished} onChange={(event) => setProjectForm({ ...projectForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingProjectId ? "Update Project" : "Add Project"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-projects">
            <h3>Projects</h3>
            <div className="admin-list">
              {projects.map((project, index) => (
                <div className="admin-list-item" key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    <span>
                      {project.category} · {project.status}
                      {project.isPublished ? "" : " · Draft"}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${project.title} up`} onClick={() => void handleReorderProjects(project.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${project.title} down`} onClick={() => void handleReorderProjects(project.id, "down")} disabled={index === projects.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${project.title}`} onClick={() => editProject(project)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${project.title}`} onClick={() => setDeleteTarget({ type: "project", id: project.id, label: project.title })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-experiences">
            <div className="admin-card-head">
              <h3>{editingExperienceId ? "Edit experience" : "New experience"}</h3>
              {editingExperienceId ? (
                <button className="icon-btn" type="button" aria-label="Cancel experience edit" onClick={resetExperienceForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateExperience}>
              <label>
                Title
                <input value={experienceForm.title} onChange={(event) => setExperienceForm({ ...experienceForm, title: event.target.value })} required />
              </label>
              <label>
                Slug
                <input value={experienceForm.slug} onChange={(event) => setExperienceForm({ ...experienceForm, slug: event.target.value })} placeholder="auto from title if empty" />
              </label>
              <label>
                Organization
                <input value={experienceForm.organization} onChange={(event) => setExperienceForm({ ...experienceForm, organization: event.target.value })} required />
              </label>
              <div className="admin-form-pair">
                <label>
                  Period
                  <input value={experienceForm.period} onChange={(event) => setExperienceForm({ ...experienceForm, period: event.target.value })} placeholder="2025 - Present" required />
                </label>
                <label>
                  Category
                  <select value={experienceForm.category} onChange={(event) => setExperienceForm({ ...experienceForm, category: event.target.value })}>
                    <option>Leadership</option>
                    <option>Teaching</option>
                    <option>Scholarship</option>
                    <option>Service</option>
                    <option>Community</option>
                    <option>Technical</option>
                  </select>
                </label>
              </div>
              <label>
                Display Order
                <input value={experienceForm.sortOrder} onChange={(event) => setExperienceForm({ ...experienceForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Summary
                <textarea value={experienceForm.summary} onChange={(event) => setExperienceForm({ ...experienceForm, summary: event.target.value })} required />
              </label>
              <label>
                Responsibilities
                <input value={experienceForm.responsibilities} onChange={(event) => setExperienceForm({ ...experienceForm, responsibilities: event.target.value })} placeholder="Separated by comma" />
              </label>
              <label>
                Impact
                <input value={experienceForm.impact} onChange={(event) => setExperienceForm({ ...experienceForm, impact: event.target.value })} placeholder="Separated by comma" />
              </label>
              <label>
                Reflection
                <textarea value={experienceForm.reflection} onChange={(event) => setExperienceForm({ ...experienceForm, reflection: event.target.value })} required />
              </label>
              <label>
                Values
                <input value={experienceForm.values} onChange={(event) => setExperienceForm({ ...experienceForm, values: event.target.value })} placeholder="Empathy, Structure, Usefulness" />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search uploaded images" />
              </label>
              <label>
                Cover Image
                <select value={experienceForm.coverMediaAssetId} onChange={(event) => setExperienceForm({ ...experienceForm, coverMediaAssetId: event.target.value })}>
                  <option value="">Use fallback or no cover</option>
                  {filteredImageMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
              </label>
              <MediaSelectionPreview asset={mediaById.get(experienceForm.coverMediaAssetId)} onClear={() => setExperienceForm({ ...experienceForm, coverMediaAssetId: "" })} />
              <label>
                Gallery Images
                <select
                  multiple
                  value={experienceForm.galleryMediaAssetIds}
                  onChange={(event) =>
                    setExperienceForm({
                      ...experienceForm,
                      galleryMediaAssetIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                    })
                  }
                >
                  {filteredImageMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
                <span className="admin-help">Hold Ctrl or Shift to select multiple gallery images.</span>
              </label>
              {experienceForm.galleryMediaAssetIds.length > 0 ? (
                <div className="admin-selected-media-grid">
                  {experienceForm.galleryMediaAssetIds.map((id) => (
                    <MediaSelectionPreview
                      asset={mediaById.get(id)}
                      key={id}
                      onClear={() => setExperienceForm({ ...experienceForm, galleryMediaAssetIds: experienceForm.galleryMediaAssetIds.filter((assetId) => assetId !== id) })}
                    />
                  ))}
                </div>
              ) : null}
              <label className="admin-check">
                <input checked={experienceForm.isFeatured} onChange={(event) => setExperienceForm({ ...experienceForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured
              </label>
              <label className="admin-check">
                <input checked={experienceForm.isPublished} onChange={(event) => setExperienceForm({ ...experienceForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingExperienceId ? "Update Experience" : "Add Experience"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-experiences">
            <h3>Experiences</h3>
            <div className="admin-list">
              {experiences.map((experience, index) => (
                <div className="admin-list-item" key={experience.id}>
                  <div>
                    <strong>{experience.title}</strong>
                    <span>
                      {experience.category} · {experience.period}
                      {experience.isPublished ? "" : " · Draft"}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${experience.title} up`} onClick={() => void handleReorderExperiences(experience.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${experience.title} down`} onClick={() => void handleReorderExperiences(experience.id, "down")} disabled={index === experiences.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${experience.title}`} onClick={() => editExperience(experience)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${experience.title}`} onClick={() => setDeleteTarget({ type: "experience", id: experience.id, label: experience.title })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-music">
            <div className="admin-card-head">
              <h3>{editingMusicId ? "Edit music track" : "New music track"}</h3>
              {editingMusicId ? (
                <button className="icon-btn" type="button" aria-label="Cancel music edit" onClick={resetMusicForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateMusic}>
              <label>
                Title
                <input value={musicForm.title} onChange={(event) => setMusicForm({ ...musicForm, title: event.target.value })} required />
              </label>
              <label>
                Artist
                <input value={musicForm.artist} onChange={(event) => setMusicForm({ ...musicForm, artist: event.target.value })} required />
              </label>
              <label>
                Note
                <textarea value={musicForm.note} onChange={(event) => setMusicForm({ ...musicForm, note: event.target.value })} required />
              </label>
              <label>
                Display Order
                <input value={musicForm.sortOrder} onChange={(event) => setMusicForm({ ...musicForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label>
                Media Search
                <input value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search audio or cover files" />
              </label>
              <label>
                Audio File
                <select value={musicForm.audioAssetId} onChange={(event) => setMusicForm({ ...musicForm, audioAssetId: event.target.value })}>
                  <option value="">Choose uploaded audio</option>
                  {filteredAudioMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
              </label>
              <MediaSelectionPreview asset={mediaById.get(musicForm.audioAssetId)} onClear={() => setMusicForm({ ...musicForm, audioAssetId: "" })} />
              <label>
                Cover Image
                <select value={musicForm.coverAssetId} onChange={(event) => setMusicForm({ ...musicForm, coverAssetId: event.target.value })}>
                  <option value="">Choose uploaded cover</option>
                  {filteredImageMediaAssets.map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.originalName}
                    </option>
                  ))}
                </select>
              </label>
              <MediaSelectionPreview asset={mediaById.get(musicForm.coverAssetId)} onClear={() => setMusicForm({ ...musicForm, coverAssetId: "" })} />
              <label className="admin-check">
                <input checked={musicForm.isActive} onChange={(event) => setMusicForm({ ...musicForm, isActive: event.target.checked })} type="checkbox" />
                Active in public playlist
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingMusicId ? "Update Track" : "Add Track"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-music">
            <h3>Music tracks</h3>
            <div className="admin-list">
              {musicTracks.map((track, index) => (
                <div className="admin-list-item" key={track.id}>
                  <div>
                    <strong>{track.title}</strong>
                    <span>
                      {track.artist}
                      {track.isActive ? " · Active" : " · Hidden"}
                      {track.audioOriginalName ? ` · ${track.audioOriginalName}` : " · No audio"}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${track.title} up`} onClick={() => void handleReorderMusic(track.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${track.title} down`} onClick={() => void handleReorderMusic(track.id, "down")} disabled={index === musicTracks.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${track.title}`} onClick={() => editMusic(track)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${track.title}`} onClick={() => setDeleteTarget({ type: "music", id: track.id, label: track.title })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-resume-media">
            <div className="admin-card-head">
              <h3>Resume manager</h3>
              <FileText size={18} />
            </div>
            <form className="admin-form" onSubmit={handleCreateResume}>
              <label>
                Label
                <input value={resumeForm.label} onChange={(event) => setResumeForm({ ...resumeForm, label: event.target.value })} placeholder="CV June 2026" />
              </label>
              <label>
                Notes
                <input value={resumeForm.notes} onChange={(event) => setResumeForm({ ...resumeForm, notes: event.target.value })} placeholder="Optional internal note" />
              </label>
              <label>
                CV PDF
                <input accept="application/pdf" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} type="file" required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Upload size={16} /> Upload and Activate CV
              </button>
            </form>
          </Card>

          <Card className="admin-card-resume-media">
            <h3>Resume versions</h3>
            <div className="admin-list">
              {resumeVersions.map((resume) => (
                <div className="admin-list-item" key={resume.id}>
                  <div>
                    <strong>{resume.label}</strong>
                    <span>
                      {resume.mediaAsset?.originalName ?? "No media attached"}
                      {resume.isActive ? " · Active" : ""}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    {resume.mediaAsset?.publicUrl ? (
                      <a className="icon-btn" href={resume.mediaAsset.publicUrl} target="_blank" rel="noreferrer" aria-label={`Open ${resume.label}`}>
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                    <button className="icon-btn" type="button" aria-label={`Activate ${resume.label}`} onClick={() => void handleActivateResume(resume.id)} disabled={resume.isActive || saving}>
                      <CheckCircle size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-resume-media">
            <div className="admin-card-head">
              <h3>Media upload</h3>
              <Upload size={18} />
            </div>
            <form className="admin-form" onSubmit={handleUploadMedia}>
              <label>
                File
                <input accept="image/*,application/pdf,audio/*,video/mp4" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} type="file" required />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Upload size={16} /> Upload Media
              </button>
            </form>
          </Card>

          <Card className="admin-card-resume-media">
            <h3>Media library</h3>
            <div className="admin-list">
              {mediaAssets.slice(0, 8).map((asset) => (
                <div className="admin-list-item" key={asset.id}>
                  <div>
                    <strong>{asset.originalName}</strong>
                    <span>
                      {asset.mimeType} · {formatBytes(asset.sizeBytes)}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <a className="icon-btn" href={asset.publicUrl} target="_blank" rel="noreferrer" aria-label={`Open ${asset.originalName}`}>
                      <ExternalLink size={15} />
                    </a>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${asset.originalName}`} onClick={() => setDeleteTarget({ type: "media", id: asset.id, label: asset.originalName })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-certifications">
            <div className="admin-card-head">
              <h3>{editingCertificationId ? "Edit certification" : "New certification"}</h3>
              {editingCertificationId ? (
                <button className="icon-btn" type="button" aria-label="Cancel certification edit" onClick={resetCertificationForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateCertification}>
              <label>
                Title
                <input value={certForm.title} onChange={(event) => setCertForm({ ...certForm, title: event.target.value })} required />
              </label>
              <label>
                Issuer
                <input value={certForm.issuer} onChange={(event) => setCertForm({ ...certForm, issuer: event.target.value })} required />
              </label>
              <label>
                Issued at
                <input value={certForm.issuedAt} onChange={(event) => setCertForm({ ...certForm, issuedAt: event.target.value })} placeholder="Jun 2026" required />
              </label>
              <label>
                Expires at
                <input value={certForm.expiresAt} onChange={(event) => setCertForm({ ...certForm, expiresAt: event.target.value })} placeholder="May 2029" />
              </label>
              <label>
                Credential URL
                <input value={certForm.credentialUrl} onChange={(event) => setCertForm({ ...certForm, credentialUrl: event.target.value })} />
              </label>
              <label>
                Skills
                <input value={certForm.skills} onChange={(event) => setCertForm({ ...certForm, skills: event.target.value })} placeholder="Android, Kotlin, ML" />
              </label>
              <label>
                Display Order
                <input value={certForm.sortOrder} onChange={(event) => setCertForm({ ...certForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={certForm.isFeatured} onChange={(event) => setCertForm({ ...certForm, isFeatured: event.target.checked })} type="checkbox" />
                Featured
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingCertificationId ? "Update Certification" : "Add Certification"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-certifications">
            <h3>Certifications</h3>
            <div className="admin-list">
              {certifications.map((certification, index) => (
                <div className="admin-list-item" key={certification.id}>
                  <div>
                    <strong>{certification.title}</strong>
                    <span>{certification.issuer} · {certification.issuedAt}</span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${certification.title} up`} onClick={() => void handleReorderCertifications(certification.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${certification.title} down`} onClick={() => void handleReorderCertifications(certification.id, "down")} disabled={index === certifications.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${certification.title}`} onClick={() => editCertification(certification)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${certification.title}`} onClick={() => setDeleteTarget({ type: "certification", id: certification.id, label: certification.title })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-systems">
            <div className="admin-card-head">
              <h3>{editingSystemId ? "Edit live system" : "New live system"}</h3>
              {editingSystemId ? (
                <button className="icon-btn" type="button" aria-label="Cancel system edit" onClick={resetSystemForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateSystem}>
              <label>
                Title
                <input value={systemForm.title} onChange={(event) => setSystemForm({ ...systemForm, title: event.target.value })} required />
              </label>
              <label>
                Description
                <textarea value={systemForm.description} onChange={(event) => setSystemForm({ ...systemForm, description: event.target.value })} required />
              </label>
              <label>
                URL
                <input value={systemForm.url} onChange={(event) => setSystemForm({ ...systemForm, url: event.target.value })} required />
              </label>
              <label>
                Embed URL
                <input value={systemForm.embedUrl} onChange={(event) => setSystemForm({ ...systemForm, embedUrl: event.target.value })} />
              </label>
              <label>
                Display Order
                <input value={systemForm.sortOrder} onChange={(event) => setSystemForm({ ...systemForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={systemForm.isEmbeddable} onChange={(event) => setSystemForm({ ...systemForm, isEmbeddable: event.target.checked })} type="checkbox" />
                Embeddable
              </label>
              <label className="admin-check">
                <input checked={systemForm.isPublished} onChange={(event) => setSystemForm({ ...systemForm, isPublished: event.target.checked })} type="checkbox" />
                Published
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingSystemId ? "Update System" : "Add System"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-systems">
            <h3>Live systems</h3>
            <div className="admin-list">
              {systems.map((system, index) => (
                <div className="admin-list-item" key={system.id}>
                  <div>
                    <strong>{system.title}</strong>
                    <span>{system.url}</span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${system.title} up`} onClick={() => void handleReorderSystems(system.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${system.title} down`} onClick={() => void handleReorderSystems(system.id, "down")} disabled={index === systems.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${system.title}`} onClick={() => editSystem(system)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${system.title}`} onClick={() => setDeleteTarget({ type: "system", id: system.id, label: system.title })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-card-contacts">
            <div className="admin-card-head">
              <h3>{editingContactId ? "Edit contact link" : "New contact link"}</h3>
              {editingContactId ? (
                <button className="icon-btn" type="button" aria-label="Cancel contact edit" onClick={resetContactForm}>
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <form className="admin-form" onSubmit={handleCreateContact}>
              <label>
                Type
                <select value={contactForm.type} onChange={(event) => setContactForm({ ...contactForm, type: event.target.value })} required>
                  <option value="email">Email</option>
                  <option value="github">GitHub</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="website">Website</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label>
                Label
                <input value={contactForm.label} onChange={(event) => setContactForm({ ...contactForm, label: event.target.value })} required />
              </label>
              <label>
                Value
                <input value={contactForm.value} onChange={(event) => setContactForm({ ...contactForm, value: event.target.value })} placeholder="Shown text, optional" />
              </label>
              <label>
                URL
                <input value={contactForm.url} onChange={(event) => setContactForm({ ...contactForm, url: event.target.value })} required />
              </label>
              <label>
                Display Order
                <input value={contactForm.sortOrder} onChange={(event) => setContactForm({ ...contactForm, sortOrder: Number(event.target.value) })} type="number" />
              </label>
              <label className="admin-check">
                <input checked={contactForm.isPrimary} onChange={(event) => setContactForm({ ...contactForm, isPrimary: event.target.checked })} type="checkbox" />
                Primary
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Plus size={16} /> {editingContactId ? "Update Contact" : "Add Contact"}
              </button>
            </form>
          </Card>

          <Card className="admin-card-contacts">
            <h3>Contact links</h3>
            <div className="admin-list">
              {contacts.map((contact, index) => (
                <div className="admin-list-item" key={contact.id}>
                  <div>
                    <strong>{contact.label}</strong>
                    <span>{contact.url}</span>
                  </div>
                  <div className="admin-row-actions">
                    <button className="icon-btn" type="button" aria-label={`Move ${contact.label} up`} onClick={() => void handleReorderContact(contact.id, "up")} disabled={index === 0 || saving}>
                      <ArrowUp size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Move ${contact.label} down`} onClick={() => void handleReorderContact(contact.id, "down")} disabled={index === contacts.length - 1 || saving}>
                      <ArrowDown size={15} />
                    </button>
                    <button className="icon-btn" type="button" aria-label={`Edit ${contact.label}`} onClick={() => editContact(contact)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn danger" type="button" aria-label={`Delete ${contact.label}`} onClick={() => setDeleteTarget({ type: "contact", id: contact.id, label: contact.label })}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="actions with-space">
          <Button to="/">Back to portfolio</Button>
        </div>
      </div>
      {deleteTarget ? <DeleteConfirmModal target={deleteTarget} saving={saving} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} /> : null}
    </section>
  );
}
