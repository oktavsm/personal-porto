export type SuggestedLink = {
  label: string;
  href: string;
};

export type PortfolioChatAnswer = {
  answer: string;
  suggestedLinks: SuggestedLink[];
};

export const chatSuggestions = [
  "Who is Okta?",
  "What projects should a recruiter see?",
  "Why core server?",
  "Is Okta suitable for Android internship?",
  "What did TELADAN shape in Okta?",
];

const fallbackLinks: SuggestedLink[] = [
  { label: "Explore story", href: "/#story" },
  { label: "View projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
];

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getLocalPortfolioAnswer(question: string): PortfolioChatAnswer {
  const normalized = question.toLowerCase();

  if (hasAny(normalized, ["android", "mobile", "internship", "magang"])) {
    return {
      answer:
        "For Android-related opportunities, Okta's strongest evidence is Titipin Android, Asclepius Skin Cancer Detection, MUEL App, and several Dicoding Android submissions. He has worked with Kotlin, Jetpack Compose, Material 3, Navigation Compose, Hilt, Retrofit, Room, Firebase, and TensorFlow Lite.",
      suggestedLinks: [
        { label: "Titipin Android", href: "/projects/titipin-android" },
        { label: "Asclepius", href: "/projects/asclepius" },
        { label: "Resume", href: "/resume" },
      ],
    };
  }

  if (hasAny(normalized, ["titipin", "jastip", "preloved"])) {
    return {
      answer:
        "Titipin is a product ecosystem for centralizing jastip and preloved activities around Malang. Okta worked on the web frontend and also built the Android companion, turning scattered buying and selling flows into a clearer product experience.",
      suggestedLinks: [
        { label: "Titipin Web", href: "/projects/titipin-web" },
        { label: "Titipin Android", href: "/projects/titipin-android" },
      ],
    };
  }

  if (hasAny(normalized, ["n8n", "automation", "workflow", "assistant", "whatsapp"])) {
    return {
      answer:
        "Okta's n8n Personal Assistant is a WhatsApp-based automation system for student life. It routes reminders, academic updates, calendar tasks, and AI chat into one personal workflow using n8n, Evolution API, Express, Gemini API, Docker, and scraping.",
      suggestedLinks: [
        { label: "n8n Project", href: "/projects/n8n-personal-assistant" },
        { label: "Live systems", href: "/systems" },
      ],
    };
  }

  if (hasAny(normalized, ["core server", "self-symbol", "symbol", "server"])) {
    return {
      answer:
        "Okta chose core server as his self-symbol because it reflects how he understands himself: quiet, connected, structured, and useful. A core server is not always seen, but it keeps many parts connected and stable.",
      suggestedLinks: [
        { label: "Lead Self", href: "/lead-self#self-symbol" },
        { label: "Core Server Map", href: "/#core-server-map" },
      ],
    };
  }

  if (hasAny(normalized, ["mission", "purpose", "goal"])) {
    return {
      answer:
        "Okta's mission is to build useful systems that turn scattered problems into structured, accessible, and reliable solutions. He expresses this through software engineering, Android development, automation, AI, and network systems.",
      suggestedLinks: [
        { label: "Mission section", href: "/#mission" },
        { label: "Projects", href: "/projects" },
      ],
    };
  }

  if (hasAny(normalized, ["value", "values", "empathy", "pld", "disability", "disabilitas"])) {
    return {
      answer:
        "Okta's core values are stability, structure, usefulness, and empathy. His early volunteer experience at Pusat Layanan Disabilitas UB shaped how he sees useful systems: a system matters when it helps people access what they need.",
      suggestedLinks: [
        { label: "Core values", href: "/#core-values" },
        { label: "Experiences", href: "/experiences" },
      ],
    };
  }

  if (hasAny(normalized, ["teladan", "tanoto", "scholar", "lead self"])) {
    return {
      answer:
        "Okta became a Tanoto Scholar through the TELADAN program. More than a scholarship title, TELADAN became a space for him to understand identity, values, self-symbol, and mission through the Lead Self journey.",
      suggestedLinks: [
        { label: "Lead Self", href: "/lead-self" },
        { label: "Experiences", href: "/experiences" },
      ],
    };
  }

  if (hasAny(normalized, ["resume", "cv", "skill", "certification", "certificate"])) {
    return {
      answer:
        "You can find Okta's compact professional profile on the Resume page. It summarizes education, technical skills, experiences, certifications, projects, and downloadable CV.",
      suggestedLinks: [
        { label: "Resume", href: "/resume" },
        { label: "Projects", href: "/projects" },
      ],
    };
  }

  if (hasAny(normalized, ["contact", "email", "linkedin", "github", "reach"])) {
    return {
      answer:
        "The fastest way to reach Okta is through the Contact page. It includes links for internship opportunities, collaborations, mentoring, project discussions, and software-related conversations.",
      suggestedLinks: [
        { label: "Contact", href: "/contact" },
        { label: "GitHub", href: "https://github.com/oktavsm" },
      ],
    };
  }

  if (hasAny(normalized, ["project", "projects", "portfolio", "work", "built", "recruiter"])) {
    return {
      answer:
        "For a quick technical review, start with Titipin Web, Titipin Android, n8n Personal Assistant, Oktaavsm Dev Playground, and Daily Digest. Together, they show frontend product work, Android development, automation, deployment, and AI-assisted workflows.",
      suggestedLinks: [
        { label: "Projects", href: "/projects" },
        { label: "Portfolio Explorer", href: "/#explorer" },
        { label: "Resume", href: "/resume" },
      ],
    };
  }

  return {
    answer:
      "I can answer based on Okta's portfolio, projects, experiences, and Lead Self journey. Try asking about his mission, projects, Android work, n8n automation, TELADAN, core server symbol, resume, or contact links.",
    suggestedLinks: fallbackLinks,
  };
}
