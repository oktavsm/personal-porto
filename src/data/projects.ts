import { media } from "./media";

export type ProjectStatus = "Deployed" | "In Development" | "Prototype" | "Paused" | "Archived";

export type Project = {
  slug: string;
  title: string;
  ecosystem?: string;
  category: "Android" | "Web" | "Automation" | "AI" | "Networking" | "Academic" | "Utility";
  priority: "Flagship" | "Featured" | "Archive";
  summary: string;
  problem: string;
  solution: string;
  role: string[];
  status: ProjectStatus;
  techStack: string[];
  links: {
    demo?: string;
    github?: string;
    download?: string;
  };
  images: string[];
  learnings: string[];
};

export const projects: Project[] = [
  {
    slug: "titipin-web",
    title: "Titipin Web",
    ecosystem: "Titipin",
    category: "Web",
    priority: "Flagship",
    summary:
      "A deployed web platform for centralizing jastip and preloved activities around Malang.",
    problem:
      "Jastip and preloved activities are scattered across WhatsApp groups, menfess accounts, Telegram, and Instagram, making discovery and coordination messy.",
    solution:
      "A web app where users can browse, post, and contact sellers or buyers through a clearer centralized flow.",
    role: ["Web Frontend Developer"],
    status: "Deployed",
    techStack: ["React 18", "Vite", "TypeScript", "Tailwind CSS", "shadcn/ui", "Zustand", "TanStack Query", "CI/CD"],
    links: {
      demo: "https://titipin.me",
      github: "https://github.com/titip-in/titip-in-web-fe.git",
    },
    images: [media.titipinLanding, media.titipinDashboard, media.titipinJastip, media.titipinPreloved],
    learnings: ["Product-oriented frontend development", "State and server-state management", "CI/CD workflow"],
  },
  {
    slug: "titipin-android",
    title: "Titipin Android",
    ecosystem: "Titipin",
    category: "Android",
    priority: "Flagship",
    summary:
      "A mobile companion for Titipin built with modern Android development practices.",
    problem:
      "Users need a more native and accessible way to browse jastip and preloved listings from their phone.",
    solution:
      "An Android app with listing flows, authentication, and local-friendly navigation for the same product ecosystem.",
    role: ["Android Developer"],
    status: "Deployed",
    techStack: ["Kotlin", "Jetpack Compose", "Material 3", "Navigation Compose", "Coil", "Hilt", "Retrofit", "Room"],
    links: {
      demo: "https://titipin.me/android",
      github: "https://github.com/titip-in/titip-in-fe.git",
      download: "https://titipin.me/android",
    },
    images: [media.titipinAndroidHome, media.titipinAndroidJastip, media.titipinAndroidPreloved],
    learnings: ["Jetpack Compose architecture", "Mobile product flow", "Android deployment workflow"],
  },
  {
    slug: "n8n-personal-assistant",
    title: "n8n Personal Assistant",
    category: "Automation",
    priority: "Flagship",
    summary:
      "A WhatsApp-based assistant that routes reminders, academic updates, calendar tasks, and AI chat into one personal workflow.",
    problem:
      "Student life requires checking email, LMS, SIAM, attendance, and calendar updates manually across many platforms.",
    solution:
      "A set of n8n workflows connected to WhatsApp, Gemini, and custom services to reduce repeated manual checking.",
    role: ["Owner", "Automation Developer"],
    status: "In Development",
    techStack: ["n8n", "Evolution API", "Express", "Gemini API", "Docker", "Scraping"],
    links: {
      github: "https://github.com/oktavsm/n8n-personal-assistant",
    },
    images: [media.n8nRouter, media.n8nEmail, media.n8nBrone, media.n8nSiam],
    learnings: ["Workflow automation", "Webhook design", "Docker deployment", "AI-assisted productivity"],
  },
  {
    slug: "muel-app",
    title: "MUEL App",
    category: "Android",
    priority: "Featured",
    summary:
      "An emotion and lifestyle monitoring Android app built with Kotlin, Firebase, and Google Cloud.",
    problem:
      "People need a simple way to record daily emotions and understand lifestyle patterns without a complicated interface.",
    solution:
      "A mobile app for emotion logging, personal insight, and cloud-backed data flow.",
    role: ["Android Developer"],
    status: "Prototype",
    techStack: ["Kotlin", "Firebase", "Google Cloud", "Android Studio"],
    links: {
      github: "https://github.com/oktavsm/muel-app",
    },
    images: [media.muel],
    learnings: ["Android UI flow", "Firebase integration", "Health/lifestyle product framing"],
  },
  {
    slug: "dev-playground",
    title: "Oktaavsm Dev Playground",
    category: "Web",
    priority: "Featured",
    summary:
      "A personal playground with APIs, AI daily content, Spotify/Last.fm status, TikSave, and assignment pages.",
    problem:
      "Small experiments often live separately and are hard to discover as part of a developer identity.",
    solution:
      "A deployed playground that collects experiments, APIs, and college assignment pages in one living dev space.",
    role: ["Full-stack Developer"],
    status: "Deployed",
    techStack: ["HTML", "CSS", "JavaScript", "Node.js", "Express", "Nginx", "Docker Compose", "GitHub Actions"],
    links: {
      demo: "https://oktaavsm.bccdev.id",
    },
    images: [media.devPlayground],
    learnings: ["Reverse proxy setup", "API integration", "Dockerized personal deployment"],
  },
  {
    slug: "asclepius",
    title: "Asclepius Skin Cancer Detection",
    category: "AI",
    priority: "Featured",
    summary:
      "An Android app using on-device TensorFlow Lite inference to detect skin cancer indications from gallery images.",
    problem:
      "Cloud-based image analysis can be slower and less privacy-friendly for simple mobile ML use cases.",
    solution:
      "An on-device ML Android submission using TensorFlow Lite, local history, and a practical inference flow.",
    role: ["Android Developer"],
    status: "Prototype",
    techStack: ["Kotlin", "Android XML", "TensorFlow Lite", "Room", "Retrofit"],
    links: {
      github: "https://github.com/oktavsm/dicoding-android-machine-learning",
    },
    images: [media.dicodingMl],
    learnings: ["On-device ML", "Model integration", "Android persistence"],
  },
  {
    slug: "daily-digest",
    title: "Daily Digest",
    category: "Automation",
    priority: "Featured",
    summary:
      "A Python automation that generates daily tech digests, updates a live page, and creates meaningful GitHub activity.",
    problem:
      "Learning notes, daily tech reading, and GitHub profile activity are often disconnected.",
    solution:
      "A cron-based script that summarizes Hacker News, generates learning cards, and publishes a daily page.",
    role: ["Automation Developer"],
    status: "Deployed",
    techStack: ["Python 3.12", "Gemini 2.5 Flash", "Hacker News API", "Cron", "Discord Webhook"],
    links: {
      github: "https://github.com/oktavsm/daily-digest",
    },
    images: [media.dailyDigest],
    learnings: ["Cron automation", "AI summarization", "Publishing lightweight generated content"],
  },
  {
    slug: "dicoding-event",
    title: "Dicoding Event",
    category: "Android",
    priority: "Archive",
    summary:
      "An Android app that fetches Dicoding event data and displays event detail and registration links.",
    problem: "Learning Android fundamentals requires a real API-driven app flow.",
    solution: "A course submission app that practices API fetching, detail pages, and navigation.",
    role: ["Android Developer"],
    status: "Archived",
    techStack: ["Kotlin", "Android XML", "Retrofit"],
    links: {
      github: "https://github.com/oktavsm/dicoding-event",
    },
    images: [media.dicodingEvent],
    learnings: ["REST API consumption", "Android navigation", "Course-based delivery"],
  },
  {
    slug: "ub-faculties",
    title: "UB Faculties",
    category: "Android",
    priority: "Archive",
    summary:
      "A beginner Android app containing faculty and study program information at Universitas Brawijaya.",
    problem: "Beginner Android learning needs a simple but structured information app.",
    solution: "A list-detail Android submission built around UB faculty data.",
    role: ["Android Developer"],
    status: "Archived",
    techStack: ["Kotlin", "Android XML"],
    links: {
      github: "https://github.com/oktavsm/dicoding-ubfaculties",
    },
    images: [media.dicodingUb],
    learnings: ["Android list UI", "Static data modeling", "Beginner Android patterns"],
  },
  {
    slug: "ngiritin",
    title: "Ngiritin",
    category: "Android",
    priority: "Archive",
    summary:
      "A student finance tracker prototype designed for coursework with AI-oriented insight concepts.",
    problem: "Students need an easier way to track spending and understand financial habits.",
    solution: "A prototype Android flow for income, expense, and AI-assisted insight concepts.",
    role: ["Android Developer", "UI Contributor"],
    status: "Prototype",
    techStack: ["Kotlin", "Android XML"],
    links: {
      github: "https://github.com/oktavsm/ngiritin-app",
    },
    images: [media.ngiritin],
    learnings: ["Product requirements", "HCI coursework", "Finance app flow"],
  },
  {
    slug: "web-scraper-automation",
    title: "Web Scraper Automation",
    category: "Utility",
    priority: "Archive",
    summary:
      "A Python and Selenium script for automating participant data verification.",
    problem: "Manual form verification can be repetitive and error-prone.",
    solution: "A browser automation script that checks records and stores results.",
    role: ["Automation Developer"],
    status: "Archived",
    techStack: ["Python", "Selenium"],
    links: {
      github: "https://github.com/oktavsm/FormAutoChecker",
    },
    images: [media.scraper],
    learnings: ["Browser automation", "Data verification", "Small utility design"],
  },
];

export const featuredProjects = projects.filter((project) => project.priority !== "Archive").slice(0, 6);
