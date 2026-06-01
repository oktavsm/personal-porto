export type VisitorPerspective = {
  id: string;
  label: string;
  shortDescription: string;
  recommendation: string;
  highlights: string[];
  links: {
    label: string;
    href: string;
  }[];
};

export type ProjectInterest = {
  id: string;
  label: string;
  description: string;
  projectSlugs: string[];
};

export const perspectives: VisitorPerspective[] = [
  {
    id: "recruiter",
    label: "Recruiter",
    shortDescription: "Evaluate technical readiness, shipped projects, and working habits.",
    recommendation:
      "Start with the projects and resume. Titipin, n8n automation, and technical experiences show how I build useful systems with real constraints.",
    highlights: ["Titipin Web", "Titipin Android", "n8n Personal Assistant", "Resume"],
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Resume", href: "/resume" },
      { label: "Experiences", href: "/experiences" },
    ],
  },
  {
    id: "mentor",
    label: "Mentor",
    shortDescription: "Understand the reflection behind my identity, values, and mission.",
    recommendation:
      "Start with Lead Self. It explains why I chose core server as a self-symbol and how stability, structure, usefulness, and empathy shape the way I grow.",
    highlights: ["Lead Self", "Core Server", "Color Code White", "Mission"],
    links: [
      { label: "Lead Self", href: "/lead-self" },
      { label: "Self-Symbol", href: "/lead-self#self-symbol" },
      { label: "Experiences", href: "/experiences" },
    ],
  },
  {
    id: "collaborator",
    label: "Collaborator",
    shortDescription: "Find what we can build, automate, or improve together.",
    recommendation:
      "Explore the projects that turn small frictions into tools. My strongest collaboration space is around web, Android, automation, AI-assisted workflows, and campus-life systems.",
    highlights: ["Systems", "n8n Workflow", "Titipin", "Contact"],
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Systems", href: "/systems" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    id: "student",
    label: "Fellow Student",
    shortDescription: "Follow the learning path, not only the final results.",
    recommendation:
      "Read the story and the smaller projects. This route shows how I learn by noticing repetitive problems, building small utilities, and improving them into systems.",
    highlights: ["Home Story", "Daily Digest", "Small Utilities", "Lead Self"],
    links: [
      { label: "Home Story", href: "/#story" },
      { label: "Projects", href: "/projects" },
      { label: "Lead Self", href: "/lead-self" },
    ],
  },
  {
    id: "curious",
    label: "Curious Visitor",
    shortDescription: "Explore the story, symbols, songs, and useful systems casually.",
    recommendation:
      "Start from the personal story, then move through the core server symbol, favorite songs, and featured projects. No need to read everything in order.",
    highlights: ["Story", "Core Server", "Favorite Songs", "Featured Projects"],
    links: [
      { label: "Story", href: "/#story" },
      { label: "Core Server", href: "/#core-server-map" },
      { label: "Projects", href: "/projects" },
    ],
  },
];

export const projectInterests: ProjectInterest[] = [
  {
    id: "android",
    label: "Android",
    description: "Mobile apps, product flows, Compose, Kotlin, and on-device ML.",
    projectSlugs: ["titipin-android", "muel-app", "asclepius"],
  },
  {
    id: "automation",
    label: "Automation",
    description: "n8n, scraping, scheduled workflows, AI-assisted routines, and small utilities.",
    projectSlugs: ["n8n-personal-assistant", "daily-digest", "web-scraper-automation"],
  },
  {
    id: "web",
    label: "Web",
    description: "React, deployed apps, live systems, frontend polish, and product routing.",
    projectSlugs: ["titipin-web", "dev-playground", "daily-digest"],
  },
  {
    id: "impact",
    label: "Social Impact",
    description: "Projects and experiences connected to accessibility, usefulness, and everyday friction.",
    projectSlugs: ["titipin-web", "titipin-android", "ngiritin"],
  },
];
