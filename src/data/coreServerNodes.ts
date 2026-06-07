export type CoreServerNode = {
  id: string;
  label: string;
  description: string;
  href: string;
  position: {
    x: number;
    y: number;
  };
};

export const coreServerNodes: CoreServerNode[] = [
  {
    id: "identity",
    label: "Identity",
    description: "A steady mind who turns scattered problems into systems that help.",
    href: "/#identity",
    position: { x: 50, y: 9 },
  },
  {
    id: "mission",
    label: "Mission",
    description: "To build useful systems that turn scattered problems into structured, accessible, and reliable solutions.",
    href: "/#mission",
    position: { x: 82, y: 24 },
  },
  {
    id: "values",
    label: "Values",
    description: "Stability, structure, usefulness, and empathy guide how I learn, work, and build.",
    href: "/#values",
    position: { x: 86, y: 62 },
  },
  {
    id: "projects",
    label: "Projects",
    description: "Projects show how I turn small frictions into usable tools, apps, automation, and systems.",
    href: "/projects",
    position: { x: 62, y: 88 },
  },
  {
    id: "experiences",
    label: "Experiences",
    description: "Experiences show how my values appear in service, leadership, teaching, and technical communities.",
    href: "/experiences",
    position: { x: 26, y: 86 },
  },
  {
    id: "lead-self",
    label: "Lead Self",
    description: "Lead Self is where I reflect on identity, Color Code White, signature strengths, self-symbol, and mission.",
    href: "/lead-self",
    position: { x: 11, y: 55 },
  },
  {
    id: "resume",
    label: "Resume",
    description: "A compact view of my skills, education, experiences, certifications, and professional profile.",
    href: "/resume",
    position: { x: 17, y: 22 },
  },
  {
    id: "systems",
    label: "Systems",
    description: "Live projects and experiments that can be opened, inspected, or used.",
    href: "/systems",
    position: { x: 50, y: 50 },
  },
];
