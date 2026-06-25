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
          premise:
            "Those roles mattered, but they are not the whole story. This portfolio is about the pattern behind them: how I think, respond, build, and grow through real problems.",
          identityCtaLabel: "Who Am I?",
          identityCtaHref: "/#who-i-am-now",
          profileName: "Oktavianus Samuel Minarto",
          profileHeadline: "A steady mind who builds systems that help",
          profileMeta: "Informatics Engineering · Universitas Brawijaya",
          profileTags: "TELADAN Scholar · Android · Automation · Network",
          symbolTitle: "Self-symbol · Core Server",
          symbolBody: "A visual metaphor for how I try to keep systems clear, connected, and useful.",
          imageKey: "profile",
        },
        sortOrder: 1,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Informatics Engineering",
              text: "Universitas Brawijaya",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "TELADAN Scholar",
              text: "Leadership development program by Tanoto Foundation",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "System Builder",
              text: "Android · Automation · AI · Network Systems",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Self-Symbol",
              text: "Core Server",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "who-i-am-now",
        title: "Before the story, this is where I stand now.",
        subtitle: "Who I am now",
        body:
          "Before telling the story of how I got here, this is where I stand now.\n\nI'm Oktavianus Samuel Minarto, an Informatics Engineering student at Universitas Brawijaya and a TELADAN Scholar from Tanoto Foundation.\n\nI'm currently focused on software engineering, especially Android development, automation, AI, and network systems. I enjoy building practical systems from real problems around me — from mobile apps and web platforms to automation workflows that reduce repetitive work.\n\nWhat connects these interests is simple: I like making scattered things easier to understand, access, and use.\n\nI may have been a winner, speaker, leader, or scholar in different moments, but what stays consistent is how I think and build: calmly, structurally, and with the intention to make something useful.",
        settingsJson: {
          imageKey: "profile",
          primaryCtaLabel: "Explore Core Values",
          primaryCtaHref: "/#core-values",
          secondaryCtaLabel: "View Projects",
          secondaryCtaHref: "/projects",
          tertiaryCtaLabel: "Open Resume",
          tertiaryCtaHref: "/resume",
        },
        sortOrder: 2,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Informatics Engineering",
              text: "Universitas Brawijaya",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "TELADAN Scholar",
              text: "Tanoto Foundation",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Current Focus",
              text: "Android · Automation · AI · Network",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Mission",
              text: "Build useful systems from scattered problems",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "early-story",
        title: "Before I knew who I was, I tried many things.",
        subtitle: "Before I knew myself",
        body:
          "Since I was young, I joined many activities. Silat, PMR, Jumbara, Pramuka, OSIS, and competitions taught me discipline, independence, care, responsibility, focus, and growth. But at that time, I was still too young to define who I was. I was only collecting pieces of myself.",
        sortOrder: 3,
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
        sortOrder: 4,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "High school technology competition",
              text: "IT knowledge competition moment.",
              imageKey: "highSchoolWinner",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "OSN certificate",
              text: "Informatics Olympiad certificate.",
              imageKey: "highSchoolCertificate",
            },
            sortOrder: 2,
          },
        ],
      },
      {
        key: "ssn-route",
        title: "For three years, I prepared for one route.",
        subtitle: "The selection I prepared for",
        body:
          "While many of my friends prepared for UTBK, I focused on a different path. I prepared for Poltek SSN because I believed it was the closest route to the future I imagined: technology, cybersecurity, public service, and contribution to the country.",
        sortOrder: 5,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "SKD Preparation",
              text: "Learning discipline, consistency, and test strategy.",
              imageKey: "ssnStudy",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "Academic Test",
              text: "Facing mathematics and English as the next gate.",
              imageKey: "ssnAfterAcademic",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Health Selection",
              text: "The stage where the route finally changed.",
              imageKey: "ssnHealth",
            },
            sortOrder: 3,
          },
        ],
      },
      {
        key: "ssn-route-note",
        title: "For a moment, it felt close.",
        subtitle: "Selection note",
        body:
          "The process started with SKD preparation, academic tests, and every stage that made the dream feel closer. One by one, I passed the early stages.\n\nFor a moment, it felt like the route I had built for years was finally opening.",
        sortOrder: 6,
      },
      {
        key: "route-turning-point",
        title: "One route closed.\nThe direction stayed.",
        subtitle: "When the route changed",
        body:
          "I passed the SKD. I passed the academic test. Then came the health selection — the stage where everything changed.\n\nIt hurt because Poltek SSN was not a sudden dream. For years, it had been the route I prepared for, the place where I imagined technology, cybersecurity, public service, and contribution to the country could meet.\n\nFor a moment, it felt like I was losing the future I had been building.\n\nBut I slowly realized that a changed route did not mean a lost direction. I still wanted to learn technology, understand systems, and build something meaningful. I just had to find another way.",
        settingsJson: {
          highlightEnabled: "true",
          highlightText: "The route changed.\nThe direction stayed.",
          timelineEnabled: "true",
          pivotTitle: "So I rebuilt the route.",
          pivotBody:
            "At the last moment, I decided to take UTBK. I started almost from zero, joined more than 20 tryouts, reviewed my mistakes, and rebuilt my study rhythm in around one and a half months.\n\nEventually, I entered Informatics Engineering at Universitas Brawijaya.\n\nIt was not the route I first imagined, but it kept me moving in the same direction.",
          mediaEnabled: "true",
          mediaLayout: "carousel",
          mediaTitle: "The route I continued through",
          mediaDescription: "Small moments from the beginning of my new route at Universitas Brawijaya.",
          ctaLabel: "Continue the story",
          ctaHref: "/#rebuilding-direction",
        },
        sortOrder: 7,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Poltek SSN prep",
              text: "A route I prepared for seriously.",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "SKD passed",
              text: "The early stage that made the prepared route feel closer.",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Academic test",
              text: "Another gate that I was able to pass.",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Health selection",
              text: "The stage where the route changed.",
            },
            sortOrder: 4,
          },
          {
            type: "card",
            contentJson: {
              title: "UTBK pivot",
              text: "A short, intense period of rebuilding the route.",
            },
            sortOrder: 5,
          },
          {
            type: "card",
            contentJson: {
              title: "Informatics UB",
              text: "A new route for the same direction.",
            },
            sortOrder: 6,
          },
          {
            type: "card",
            contentJson: {
              title: "Early UB moment",
              text: "One of the early moments after entering Universitas Brawijaya, where I started rebuilding my direction through Informatics Engineering.",
              imageKey: "firstUbMaba",
            },
            sortOrder: 7,
          },
          {
            type: "card",
            contentJson: {
              title: "First campus route",
              text: "A small reminder that the route had changed, but the direction to keep learning technology was still there.",
              imageKey: "firstUbFilkom",
            },
            sortOrder: 8,
          },
          {
            type: "card",
            contentJson: {
              title: "First class rhythm",
              text: "The beginning of a new route that eventually led me to projects, TELADAN, and deeper self-reflection.",
              imageKey: "firstUbKelasPertama",
            },
            sortOrder: 9,
          },
          {
            type: "card",
            contentJson: {
              title: "UTBK preparation notes",
              text: "A trace from the short, intense period of rebuilding my study rhythm before entering UB.",
              imageKey: "firstUbCatatanUtbk1",
            },
            sortOrder: 10,
          },
        ],
      },
      {
        key: "route-changed",
        title: "But not every path opens the way we expect.",
        subtitle: "When the route changed",
        body:
          "The selection process started well. I passed SKD. I passed the academic test. Then came the health selection — the stage where everything changed.\n\nIt hurt, because it was not only a failed selection. It felt like losing a version of myself that I had been building for years.\n\nThe dream was still there, but the route had to change.",
        sortOrder: 8,
        isPublished: false,
      },
      {
        key: "route-mission",
        title: "The route changed.\nThe mission didn't.",
        body:
          "At the last moment, I decided to take UTBK. I started almost from zero, because I had never fully prepared for that path before. In around one and a half months, I joined more than 20 tryouts, reviewed my mistakes, rebuilt my study rhythm, and forced myself to adapt quickly.\n\nEventually, I entered Informatics at Universitas Brawijaya. It was not an escape. It was a conscious choice. I realized that my dream did not have to disappear. I could still learn technology, build systems, and prepare myself to contribute through software, AI, networks, and maybe one day, government technology.",
        sortOrder: 9,
        isPublished: false,
      },
      {
        key: "rebuilding-direction",
        title: "After entering UB, I tried to rebuild my direction.",
        subtitle: "Rebuilding my direction",
        body:
          "Entering Informatics UB gave me a new route, but I knew that I still had to rebuild myself. I started applying for scholarships and development opportunities. I was rejected many times, revised my applications, improved my essays, reflected on my experiences, and tried again.\n\nEventually, I became a Tanoto Scholar through the TELADAN program. But more than the title, TELADAN became a space where I had to ask a deeper question: who am I, beyond everything I have achieved?",
        settingsJson: {
          imageKey: "tanoto",
        },
        sortOrder: 10,
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
        sortOrder: 11,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "TELADAN scholarship moment",
              text: "A scholarship and growth moment.",
              imageKey: "tanoto",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "Speaking and mentoring moment",
              text: "A moment of speaking and sharing.",
              imageKey: "speakerTeladan",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Camp Daniel leadership moment",
              text: "A leadership and community moment.",
              imageKey: "campDanielWide",
            },
            sortOrder: 3,
          },
        ],
      },
      {
        key: "quiet-pattern",
        body:
          "When the titles became too loud, I found what stayed quiet.\n\nIt was never the title.\n\nIt was the moment when something I built actually helped someone.\n\nA small script. An automation. A mobile app. A tool that reduces repetitive work. A system that makes scattered things easier to use.\n\nSince my first semester, I have built small tools and projects not because they were impressive, but because they solved something around me.\n\nThat is where I feel most like myself.",
        sortOrder: 12,
      },
      {
        key: "identity",
        title: "A steady mind who turns scattered problems into systems that help.",
        subtitle: "So, who am I?",
        body:
          "I am not only a winner, speaker, leader, scholar, or developer. Those are moments, roles, and responsibilities.\n\nThe pattern behind them is clearer: I tend to observe scattered problems, organize them into structure, and build systems that help people move easier.",
        sortOrder: 13,
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
        sortOrder: 14,
        blocks: [
          {
            type: "card",
            contentJson: {
              title: "Empathy",
              text: "Noticing the people behind the system.",
            },
            sortOrder: 1,
          },
          {
            type: "card",
            contentJson: {
              title: "Accessibility",
              text: "Making information reachable for different needs.",
            },
            sortOrder: 2,
          },
          {
            type: "card",
            contentJson: {
              title: "Usefulness",
              text: "Building things that help in real situations.",
            },
            sortOrder: 3,
          },
          {
            type: "card",
            contentJson: {
              title: "Social Intelligence",
              text: "Reading context, needs, and tension with care.",
            },
            sortOrder: 4,
          },
        ],
      },
      {
        key: "values",
        title: "The values I keep returning to",
        subtitle: "Core values",
        body: "Stability, structure, usefulness, and empathy are the values I keep seeing across the way I learn, serve, and build.",
        sortOrder: 15,
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
        key: "values-together",
        title: "How these values work together",
        subtitle: "Values in motion",
        body:
          "When these values work together, they become the way I solve problems.\n\nEmpathy helps me notice what people need. Structure helps me organize the scattered parts. Stability helps me respond without rushing. Usefulness helps me make sure the result actually matters.\n\nThis combination is one of my unique strengths. I may not always be the loudest person in the room, but I can read the situation, organize the problem, and keep moving until the system becomes clearer and more helpful.",
        sortOrder: 16,
      },
      {
        key: "mission",
        title: "To build useful systems that turn scattered problems into structured, accessible, and reliable solutions.",
        subtitle: "My mission",
        body:
          "This is the pattern I keep returning to. I like helping unclear things become clearer, repetitive things become lighter, and scattered flows become easier to use.",
        sortOrder: 17,
      },
      {
        key: "mission-preface",
        title: "My mission comes from the pattern I found in myself.",
        subtitle: "Before the mission",
        body:
          "I am interested in work that lets me investigate how a problem works, understand the structure behind it, and build something practical from that understanding.\n\nThat is why software engineering, Android development, automation, AI, and network systems feel aligned with me. They allow me to combine technical curiosity, structured thinking, and the desire to make something useful for real people.",
        sortOrder: 18,
      },
      {
        key: "mission-alignment",
        title: "How I approach work",
        subtitle: "Work pattern",
        body:
          "My investigative side makes me curious about how systems work and why a problem happens. My conventional side makes me comfortable with structure, documentation, flow, and organized execution. My realistic side makes me enjoy hands-on implementation, where ideas are tested through real tools, code, and systems.\n\nAt the same time, my interpersonal side appears in the way I try to understand users, students, teammates, and the people affected by the system.",
        sortOrder: 19,
      },
      {
        key: "mission-application",
        title: "How I apply it through technology",
        subtitle: "Technology direction",
        body:
          "Through Android development, I can build tools people can access directly from their daily devices. Through automation, I can reduce repetitive work and connect scattered information. Through AI, I can explore systems that adapt and assist more intelligently. Through network systems, I can understand how services connect, communicate, and stay reliable.",
        sortOrder: 20,
      },
      {
        key: "core-server-map",
        title: "Core Server as a living map.",
        subtitle: "Interactive self-symbol",
        body:
          "I chose a core server as my self-symbol because it reflects how I understand myself: steady, connected, structured, and useful. Each node represents a part of my portfolio, from identity and values to projects and experiences.\n\nClick a node to see how each part connects to the rest of my story.",
        settingsJson: {
          selectedKicker: "Selected node",
          centerLabel: "Core Server",
          linkLabel: "Open related page",
        },
        sortOrder: 21,
      },
      {
        key: "music",
        title: "Some songs do not push me to be stronger.",
        subtitle: "Songs that give me space",
        body:
          "They simply give me space to breathe. Hindia's “everything u are” and “Evaluasi (Reprise)” do not feel like forced motivation. They feel calm, honest, and human — like a quiet reminder that I am allowed to rest and still continue.\n\nResting is not the opposite of trying. Sometimes, resting is how I keep trying.",
        settingsJson: {
          blockedMessage: "Autoplay was blocked by the browser. Press play to start the soundtrack.",
        },
        sortOrder: 22,
      },
      {
        key: "explorer",
        title: "Now choose where to go deeper.",
        subtitle: "Portfolio explorer",
        body:
          "Not every visitor comes for the same reason. This explorer helps you find the parts of my portfolio that are most relevant to your purpose — whether you are a recruiter, mentor, collaborator, fellow student, or just curious.\n\nChoose your perspective, and I will route you to the most relevant parts of this portfolio.",
        sortOrder: 23,
      },
      {
        key: "project-matchmaker",
        title: "Find projects by interest.",
        subtitle: "Project matchmaker",
        body:
          "This matchmaker helps you explore my projects based on the kind of problem, technology, or interest you care about. Instead of reading every project one by one, you can start from what matters to you.\n\nPick an interest, and I will show the projects that fit it best.",
        sortOrder: 24,
      },
      {
        key: "route-modal",
        title: "Choose your path, or keep reading the story.",
        subtitle: "Quick route",
        body:
          "If you already know what you need, jump directly. If not, continue the story first and this route will appear again near the end.",
        settingsJson: {
          primaryCtaLabel: "Continue the story",
          secondaryCtaLabel: "See full explorer later",
        },
        sortOrder: 25,
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
        sortOrder: 26,
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
        sortOrder: 27,
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
        sortOrder: 28,
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
