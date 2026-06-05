import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export const articleWritingContextMarkdown = `# Article Writing Context for Oktavianus Samuel Minarto

Use this context to generate article drafts for Okta's personal portfolio. This is a writing-style guide, not a complete fact database. Use the provided raw notes, source context, and available media as the source of truth.

## Voice

Write as Okta in first person. The tone should feel reflective, grounded, calm, clear, honest, and professional enough for a public portfolio.

The article should sound like a thoughtful student-builder reflecting on what he experienced, learned, built, or observed.

Avoid sounding like:
- a corporate press release,
- a LinkedIn bragging post,
- an overly polished AI essay,
- a motivational speech,
- a poetic diary,
- a technical report with no personal reflection.

## Identity Signals

Okta often writes from the perspective of someone who:
- learns by building,
- thinks in systems,
- observes before reacting,
- turns scattered problems into clearer structure,
- values usefulness over appearance,
- prefers calm reflection over loud self-promotion,
- wants his work to help real people,
- is still learning and improving.

Do not overuse identity slogans. If useful, the recurring idea is: a steady mind who turns scattered problems into systems that help.

## Language

Write in English unless the request explicitly asks otherwise. If raw notes are Indonesian, translate naturally. Use simple, clear English with short to medium sentences and readable paragraphs.

## Reflection Pattern

Most articles should follow this shape:
1. Context: what happened, what role/event/project this was.
2. Initial expectation: what Okta thought before or at the beginning.
3. Process: what he did or observed.
4. Challenge or realization: what was difficult, surprising, or meaningful.
5. Connection: how it connects to systems, people, learning, usefulness, empathy, structure, calmness, or perseverance.
6. Takeaway: what lesson he carries forward.
7. Closing reflection: a modest final thought.

Use natural headings, not generic headings like "Introduction", "Body", or "Conclusion".

Good heading examples:
- From Theory to Practice
- Learning by Doing
- What I Did Not Notice at First
- The Work Behind the Role
- When the System Became Real
- What This Experience Taught Me
- Closing Reflection

## Themes

Use only when relevant:
- Systems thinking: process, structure, coordination, tools, workflows, networks, committees.
- Usefulness: work that makes something easier or more helpful for real people.
- Structure: turning scattered information or messy work into clearer flow.
- Empathy: understanding people, access, learning needs, service, teamwork.
- Perseverance: quiet consistency through repeated work or difficulty.
- Calmness: creating space to think under pressure.

## Style Rules

Prefer:
- "I realized..."
- "I started to see..."
- "What stayed with me was..."
- "This helped me understand..."
- "Looking back..."

Avoid:
- invented achievements,
- exaggerated impact,
- overclaiming,
- generic AI phrases,
- too many buzzwords,
- too much jargon unless the article is technical.

Avoid phrases like:
- transformative journey,
- valuable insights,
- passion for excellence,
- impactful innovation,
- seamless integration,
- holistic approach.

## Article Metadata

Titles should be clear, reflective, specific, and not clickbait.

Good title examples:
- Building Enterprise Wi-Fi from Survey to Deployment
- Learning Wi-Fi by Building It
- What Teaching Assistantship Taught Me About Learning Systems

The excerpt should be 1-2 sentences and suitable for article cards.

## Media Guidance

Use images only from availableMedia. Do not create image URLs. Preserve mediaAssetId and publicUrl from availableMedia.

Use captions that describe the real moment calmly. If a photo is central, place it as an image near the relevant section. If several photos support the story, use a gallery or carousel.

## Output Reminder

Return structured article JSON only. Do not include markdown fences. Do not publish automatically.`;

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

  app.get("/api/public/article-context.md", async (_request, reply) => {
    return reply.header("Content-Type", "text/markdown; charset=utf-8").send(articleWritingContextMarkdown);
  });
}
