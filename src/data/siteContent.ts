export type SiteContentBlock = {
  type: string;
  contentJson: Record<string, unknown>;
  sortOrder: number;
  isPublished?: boolean;
};

export type SiteContentSection = {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  settingsJson?: Record<string, unknown>;
  sortOrder: number;
  isPublished?: boolean;
  blocks?: SiteContentBlock[];
};

export type SiteContentPage = {
  slug: string;
  title: string;
  description?: string;
  sections: SiteContentSection[];
};

export const siteContentPages: SiteContentPage[] = [
  {
    slug: "home",
    title: "Home",
    description: "Main portfolio storytelling page.",
    sections: [
      {
        key: "hero",
        title: "Winner?\nSpeaker?\nLeader?\nNo, I'm not.",
        subtitle: "Oktavianus Samuel Minarto · Systems That Help",
        body:
          "I've been there. But those are not who I am.\n\nI'm Oktavianus Samuel Minarto — an Informatics student who learns by building, thinks in systems, and tries to make scattered things work better.\n\nI let things flow, but I stand my ground.",
        settingsJson: {
          primaryCtaLabel: "Explore My Story",
          primaryCtaHref: "/#story",
          secondaryCtaLabel: "View Projects",
          secondaryCtaHref: "/projects",
          tertiaryCtaLabel: "Choose Route",
          imageKey: "profile",
        },
        sortOrder: 1,
      },
      {
        key: "early-story",
        title: "Before I knew who I was, I tried many things.",
        subtitle: "Before I knew myself",
        body:
          "Since I was young, I joined many activities. Silat, PMR, Jumbara, Pramuka, OSIS, and competitions taught me discipline, independence, care, responsibility, focus, and growth. But at that time, I was still too young to define who I was. I was only collecting pieces of myself.",
        sortOrder: 2,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Silat",
              text: "Discipline, physical control, consistency, and courage to train through repetition.",
              imageKey: "earlySilat",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "PMR & Jumbara",
              text: "Care, independence, service, and perspective beyond my daily environment.",
              imageKey: "earlyPmr",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Pramuka / OSIS",
              text: "Responsibility, teamwork, and early experience in leading and organizing people.",
              imageKey: "earlyPramuka",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Competitions",
              text: "Focus, growth, and courage to test myself through challenges.",
              imageKey: "highSchoolWinner",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "chosen-path",
        title: "Then I found a path I wanted to fight for.",
        subtitle: "A path I chose early",
        body:
          "In high school, I started to take technology seriously. I joined Informatics Olympiad and IT knowledge competitions. I began to see technology not only as something I liked, but as a path I wanted to pursue.\n\nAt that time, my dream was clear: Poltek SSN. I wanted to be part of cybersecurity, public service, and technology for the country.\n\nFor the first time, I thought: maybe this is really me.",
        sortOrder: 3,
      },
      {
        key: "ssn-route",
        title: "For three years, I prepared for one route.",
        subtitle: "The selection I prepared for",
        body:
          "While many of my friends prepared for UTBK, I focused on a different path. I prepared for Poltek SSN because I believed it was the closest route to the future I imagined: technology, cybersecurity, public service, and contribution to the country.",
        sortOrder: 4,
      },
      {
        key: "route-changed",
        title: "But not every path opens the way we expect.",
        subtitle: "When the route changed",
        body:
          "The selection process started well. I passed SKD. I passed the academic test. Then came the health selection — the stage where everything changed.\n\nIt hurt, because it was not only a failed selection. It felt like losing a version of myself that I had been building for years.\n\nThe dream was still there, but the route had to change.",
        sortOrder: 5,
      },
      {
        key: "route-mission",
        title: "The route changed.\nThe mission didn't.",
        body:
          "At the last moment, I decided to take UTBK. I started almost from zero, because I had never fully prepared for that path before. In around one and a half months, I joined more than 20 tryouts, reviewed my mistakes, rebuilt my study rhythm, and forced myself to adapt quickly.\n\nEventually, I entered Informatics at Universitas Brawijaya. It was not an escape. It was a conscious choice. I realized that my dream did not have to disappear. I could still learn technology, build systems, and prepare myself to contribute through software, AI, networks, and maybe one day, government technology.",
        sortOrder: 6,
      },
      {
        key: "rebuilding-direction",
        title: "After entering UB, I tried to accelerate my growth.",
        subtitle: "Rebuilding my direction",
        body:
          "Entering Informatics UB gave me a new route, but I knew that I still had to rebuild myself. I started applying for scholarships and development opportunities. I was rejected many times, revised my applications, improved my essays, reflected on my experiences, and tried again.\n\nEventually, I became a Tanoto Scholar through the TELADAN program. But more than the title, TELADAN became a space where I had to ask a deeper question: who am I, beyond everything I have achieved?",
        settingsJson: {
          imageKey: "tanoto",
        },
        sortOrder: 7,
      },
      {
        key: "many-things",
        title: "From the outside, it looked like progress.",
        subtitle: "Then I became many things",
        body:
          "I became a scholar. I joined organizations. I became a project leader. I joined competitions. I became a speaker. I built projects and took more responsibilities.\n\nBut somewhere along the way, I started to feel tired. I was moving, but not always steering. I was doing many things, but I was not always becoming myself.",
        settingsJson: {
          imageKey: "tanoto",
        },
        sortOrder: 8,
      },
      {
        key: "quiet-pattern",
        body:
          "When the titles became too loud, I found what stayed quiet.\n\nIt was never the title.\n\nIt was the moment when something I built actually helped someone.\n\nA small script. An automation. A mobile app. A tool that reduces repetitive work. A system that makes scattered things easier to use.\n\nSince my first semester, I have built small tools and projects not because they were impressive, but because they solved something around me.\n\nThat is where I feel most like myself.",
        sortOrder: 9,
      },
      {
        key: "identity",
        title: "A steady mind who turns scattered problems into systems that help.",
        subtitle: "So, who am I?",
        body:
          "I am not only a winner, speaker, leader, scholar, or developer. Those are moments, roles, and responsibilities.\n\nThe pattern behind them is clearer: I tend to observe scattered problems, organize them into structure, and build systems that help people move easier.",
        sortOrder: 10,
      },
      {
        key: "empathy",
        title: "One early experience changed how I see useful systems.",
        subtitle: "Empathy in practice",
        body:
          "Before many of my technical projects, I volunteered at Pusat Layanan Disabilitas Universitas Brawijaya. That experience taught me that useful systems are not only efficient. They also need to be accessible, considerate, and aware of people whose needs are not always visible.",
        settingsJson: {
          imageKey: "pldVolunteer",
        },
        sortOrder: 11,
      },
      {
        key: "values",
        title: "The values I keep returning to",
        subtitle: "Core values",
        body: "Stability, structure, usefulness, and empathy are the values I keep seeing across the way I learn, serve, and build.",
        sortOrder: 12,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Stability",
              text: "I try to stay steady before making decisions. Calmness is the space I create before choosing a response.",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "Structure",
              text: "I naturally look for patterns, flows, and missing connections in scattered things.",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Usefulness",
              text: "I want what I build to reduce friction, solve a real need, or help someone move easier.",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Empathy",
              text: "Good systems should consider the people who use them, including needs that are not visible at first.",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "mission",
        title: "To build useful systems that turn scattered problems into structured, accessible, and reliable solutions.",
        subtitle: "My mission",
        body:
          "This is the pattern I keep returning to. I like helping unclear things become clearer, repetitive things become lighter, and scattered flows become easier to use.",
        sortOrder: 13,
      },
      {
        key: "featured-projects",
        title: "Things I built when I noticed friction",
        subtitle: "Selected work",
        body: "Each project started from a small friction: scattered information, repetitive work, unclear flow, or a need that could be made easier through software.",
        settingsJson: {
          ctaLabel: "Explore My Projects",
          ctaHref: "/projects",
        },
        sortOrder: 14,
      },
      {
        key: "featured-experiences",
        title: "Experiences that shaped how I build and serve",
        subtitle: "Experiences",
        body: "I treat experiences as evidence of how values show up in real situations: service, leadership, teaching, technical growth, and community contribution.",
        settingsJson: {
          ctaLabel: "See My Experiences",
          ctaHref: "/experiences",
        },
        sortOrder: 15,
      },
      {
        key: "closing",
        title: "This portfolio is still running.",
        subtitle: "Still running",
        body:
          "It is not a finished archive. It is a living system for my projects, reflections, and the things I am still learning to build.\n\nI build systems that help.",
        settingsJson: {
          primaryCtaLabel: "View Projects",
          primaryCtaHref: "/projects",
          secondaryCtaLabel: "Download Resume",
          secondaryCtaHref: "resume",
          tertiaryCtaLabel: "Contact Me",
          tertiaryCtaHref: "/contact",
        },
        sortOrder: 16,
      },
    ],
  },
  {
    slug: "lead-self",
    title: "Lead Self",
    description: "Lead Self reflection page.",
    sections: [
      {
        key: "intro",
        title: "Understanding the system within myself",
        subtitle: "Lead Self Journey",
        body:
          "This page summarizes the reflections behind my identity, values, mission, and self-symbol during the Lead Self journey. It is not a collection of labels. It is a map of how I understand the way I think, respond, build, and grow.",
        settingsJson: {
          imageKey: "profile",
        },
        sortOrder: 1,
      },
      {
        key: "identity",
        title: "A steady mind who turns scattered problems into systems that help.",
        subtitle: "Who am I?",
        body:
          "After going through The Weapon and The Self, I learned to see myself beyond labels such as scholar, student, leader, speaker, or organization member. Those roles are part of my journey, but they are not the deepest definition of who I am.\n\nI understand myself more through the way I think, respond, and build. I tend to observe before reacting, organize before executing, and look for ways to make things work better.",
        sortOrder: 2,
      },
      {
        key: "color-code",
        title: "Color Code: White",
        body:
          "My dominant Color Code is White, with peace as the main motivation. For me, White does not mean being passive or avoiding responsibility. It means I naturally value calmness, emotional stability, and thoughtful response.\n\nCalmness is not passivity. It is the space I create before choosing a response.",
        sortOrder: 3,
      },
      {
        key: "strengths",
        title: "Signature Strengths: Social Intelligence & Perseverance",
        body:
          "Social Intelligence helps me read situations, understand people's needs, and adjust how I communicate. Perseverance helps me continue even when the process feels tiring. My perseverance is not always loud or dramatic. It often appears as quiet consistency.",
        sortOrder: 4,
      },
      {
        key: "self-symbol",
        title: "Core Server",
        subtitle: "Self-symbol",
        body:
          "A core server is not always seen, but it keeps the system connected. It receives, processes, organizes, and distributes information. It supports many connections at once.\n\nThis symbol is close to the way I understand myself. I am not always the most vocal person in a group, but I often care about whether the system works: whether the timeline is clear, whether communication flows, whether people understand their roles, and whether the final result is useful.\n\nI do not need to be the loudest part of the system. I want to be a part that helps the system work better.",
        settingsJson: {
          imageKey: "coreServer",
        },
        sortOrder: 5,
      },
      {
        key: "empathy",
        title: "Accessibility taught me what usefulness really means.",
        subtitle: "Empathy evidence",
        body:
          "My early experience as a volunteer typist at Pusat Layanan Disabilitas Universitas Brawijaya helped me see that support can be quiet but meaningful. It deepened my empathy and became one of the values I carried into my TELADAN journey.",
        settingsJson: {
          imageKey: "pldVolunteer",
        },
        sortOrder: 6,
      },
      {
        key: "mission",
        title: "What I want to build from here",
        subtitle: "Mission",
        body:
          "My mission is to build useful systems that turn scattered problems into structured, accessible, and reliable solutions.\n\nThis mission comes from the pattern I found in myself. I often feel meaningful when I can take something scattered, repetitive, inefficient, or unclear, then make it easier to understand and use.\n\nSoftware engineering, Android development, automation, AI, and network systems are different ways for me to build systems that help people.",
        sortOrder: 7,
      },
      {
        key: "evidence",
        title: "Where this reflection appears in real life",
        subtitle: "Evidence in practice",
        body: "The reflection is not meant to stay abstract. It shows up in the way I serve, lead, teach, and build.",
        sortOrder: 8,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Volunteer Typist — PLD UB",
              text: "Social Intelligence and empathy appeared when I helped make lecture information accessible for students with disabilities.",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "Camp Daniel",
              text: "Structure and perseverance appeared when I led a committee by managing timelines, communication, and coordination across divisions.",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Titipin",
              text: "Usefulness and system thinking appeared when I tried to centralize scattered jastip and preloved activities into a clearer platform.",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "n8n Automation",
              text: "Automation and problem-solving appeared when I built workflows to reduce repetitive checking of academic and personal information.",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "closing",
        title: "I am still being built.",
        body:
          "Lead Self did not give me a final answer about who I am. Instead, it helped me see the pattern behind my choices, strengths, and struggles.\n\nI am still learning how to be more assertive, more focused, and more honest with what I want. But for now, I understand one thing more clearly: I feel most like myself when I build systems that help.",
        sortOrder: 9,
      },
    ],
  },
];
