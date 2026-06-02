import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

function line(value?: string | null) {
  return value?.trim() || "";
}

function list(items: string[]) {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

function contentBlockSummary(contentJson: unknown) {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) return "";
  const content = contentJson as Record<string, unknown>;
  const title = typeof content.title === "string" ? content.title : "";
  const text = typeof content.text === "string" ? content.text : "";
  return [title, text].filter(Boolean).join(": ");
}

async function generatePortfolioContextMarkdown() {
  const [pages, projects, experiences, certifications, systems, contacts, resume] = await Promise.all([
    prisma.sitePage.findMany({
      include: {
        sections: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          include: {
            blocks: {
              where: { isPublished: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { isPublished: true },
      include: {
        roles: { orderBy: { sortOrder: "asc" } },
        techStack: { orderBy: { sortOrder: "asc" } },
        learnings: { orderBy: { sortOrder: "asc" } },
        links: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.experience.findMany({
      where: { isPublished: true },
      include: {
        responsibilities: { orderBy: { sortOrder: "asc" } },
        impacts: { orderBy: { sortOrder: "asc" } },
        values: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.certification.findMany({
      include: { skills: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.liveSystem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.contactLink.findMany({
      orderBy: [{ sortOrder: "asc" }],
    }),
    prisma.resumeVersion.findFirst({
      where: { isActive: true, mediaAssetId: { not: null } },
      include: { mediaAsset: true },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const pageContext = pages
    .map((page) => {
      const sections = page.sections
        .map((section) => {
          const parts = [
            `### ${section.title || section.key}`,
            section.subtitle ? `Subtitle: ${section.subtitle}` : "",
            section.body ? section.body : "",
            section.blocks.length > 0 ? list(section.blocks.map((block) => contentBlockSummary(block.contentJson))) : "",
          ].filter(Boolean);
          return parts.join("\n");
        })
        .join("\n\n");
      return [`## Page: ${page.title} (${page.slug})`, page.description ?? "", sections].filter(Boolean).join("\n\n");
    })
    .join("\n\n");

  const projectContext = projects
    .map((project) =>
      [
        `## ${project.title}`,
        `Route: /projects/${project.slug}`,
        `Category: ${project.category}`,
        `Priority: ${project.priority}`,
        `Status: ${project.status}`,
        project.ecosystem ? `Ecosystem: ${project.ecosystem}` : "",
        `Summary: ${project.summary}`,
        `Problem: ${project.problem}`,
        `Solution: ${project.solution}`,
        project.roles.length > 0 ? `Roles:\n${list(project.roles.map((role) => role.label))}` : "",
        project.techStack.length > 0 ? `Tech Stack:\n${list(project.techStack.map((tech) => tech.label))}` : "",
        project.learnings.length > 0 ? `Learnings:\n${list(project.learnings.map((learning) => learning.text))}` : "",
        project.links.length > 0 ? `Links:\n${list(project.links.map((link) => `${link.label}: ${link.url}`))}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  const experienceContext = experiences
    .map((experience) =>
      [
        `## ${experience.title}`,
        `Route: /experiences/${experience.slug}`,
        `Organization: ${experience.organization}`,
        `Period: ${experience.period}`,
        `Category: ${experience.category}`,
        `Summary: ${experience.summary}`,
        `Reflection: ${experience.reflection}`,
        experience.responsibilities.length > 0 ? `Responsibilities:\n${list(experience.responsibilities.map((item) => item.text))}` : "",
        experience.impacts.length > 0 ? `Impact:\n${list(experience.impacts.map((item) => item.text))}` : "",
        experience.values.length > 0 ? `Values:\n${list(experience.values.map((item) => item.label))}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  const certificationContext = certifications
    .map((certification) => {
      const skills = certification.skills.map((skill) => skill.label).filter(Boolean).join(", ");
      return `- ${certification.title} - ${certification.issuer}, issued ${certification.issuedAt}${certification.expiresAt ? `, valid until ${certification.expiresAt}` : ""}${skills ? `, skills: ${skills}` : ""}${certification.credentialUrl ? `, credential: ${certification.credentialUrl}` : ""}`;
    })
    .join("\n");

  const systemContext = systems.map((system) => `- ${system.title}: ${system.description} (${system.url})`).join("\n");
  const contactContext = contacts.map((contact) => `- ${contact.label}: ${line(contact.value) || contact.url}`).join("\n");

  return [
    "# Oktavianus Samuel Minarto Portfolio Context",
    "This context is generated from the live portfolio database. Use it as the source of truth for portfolio chatbot answers.",
    "",
    "## Identity",
    "Name: Oktavianus Samuel Minarto",
    "Profile: Informatics Engineering student at Universitas Brawijaya.",
    "Routes: /, /projects, /experiences, /lead-self, /resume, /systems, /contact",
    "",
    "# CMS Page Copy",
    pageContext,
    "",
    "# Projects",
    projectContext,
    "",
    "# Experiences",
    experienceContext,
    "",
    "# Certifications",
    certificationContext || "No certifications available.",
    "",
    "# Live Systems",
    systemContext || "No live systems available.",
    "",
    "# Resume",
    resume?.mediaAsset ? `Active resume: ${resume.label} (${resume.mediaAsset.publicUrl})` : "No active resume available.",
    "",
    "# Contact Links",
    contactContext || "No contact links available.",
  ].join("\n");
}

export async function portfolioContextRoutes(app: FastifyInstance) {
  app.get("/api/public/portfolio-context.md", async (_request, reply) => {
    const markdown = await generatePortfolioContextMarkdown();
    return reply.header("Content-Type", "text/markdown; charset=utf-8").send(markdown);
  });
}
