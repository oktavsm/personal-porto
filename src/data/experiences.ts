import { media } from "./media";

export type Experience = {
  slug: string;
  title: string;
  organization: string;
  period: string;
  category: "Leadership" | "Teaching" | "Scholarship" | "Service" | "Community" | "Technical";
  summary: string;
  responsibilities: string[];
  impact: string[];
  reflection: string;
  values: string[];
  image?: string;
};

export const experiences: Experience[] = [
  {
    slug: "pld-ub-volunteer",
    title: "Volunteer Typist",
    organization: "Pusat Layanan Disabilitas Universitas Brawijaya",
    period: "Early university journey",
    category: "Service",
    summary:
      "Supported accessibility by helping lecture information become reachable for students with disabilities.",
    responsibilities: [
      "Provided real-time academic typing support.",
      "Practiced listening carefully and communicating with patience.",
      "Helped turn spoken information into accessible learning support.",
    ],
    impact: [
      "Deepened Okta's empathy and social intelligence.",
      "Became a value carried into the TELADAN scholarship selection and Lead Self journey.",
    ],
    reflection:
      "I learned that support is not always loud or visible. Sometimes, it means making information accessible for someone else.",
    values: ["Empathy", "Social Intelligence", "Usefulness"],
    image: media.pldVolunteer,
  },
  {
    slug: "camp-daniel",
    title: "Project Leader — Camp Daniel",
    organization: "PMK Daniel FILKOM UB",
    period: "Jun 2025 - Nov 2025",
    category: "Leadership",
    summary:
      "Led the full planning and execution of a 3-day welcoming camp for new Christian students at FILKOM.",
    responsibilities: [
      "Coordinated cross-divisional committee work.",
      "Managed planning, operations, timeline, and evaluation.",
      "Kept communication clear through workload and coordination challenges.",
    ],
    impact: ["Strengthened structured leadership and perseverance.", "Created a clearer flow for the committee and participants."],
    reflection:
      "Leadership was not about being loud. It was about helping people move with clarity.",
    values: ["Structure", "Perseverance", "Stability"],
    image: media.campDaniel,
  },
  {
    slug: "icn-laboratory",
    title: "Education Division Member",
    organization: "Information Centric Networking Laboratory — FILKOM UB",
    period: "Feb 2026 - Present",
    category: "Technical",
    summary:
      "Supports practical courses, assistant scheduling, session planning, and module refactoring in a networking-focused laboratory.",
    responsibilities: [
      "Support Operating Systems and Introduction to Computer Networks practical courses.",
      "Contribute to assistant scheduling and practical session planning.",
      "Help refactor modules to improve learning quality.",
    ],
    impact: ["Connects technical depth with teaching and system improvement.", "Strengthens network systems interest."],
    reflection:
      "The lab helped me see learning as a system: materials, assistants, students, tools, and timing all need to connect.",
    values: ["Structure", "Usefulness", "Stability"],
    image: media.apieCamp,
  },
  {
    slug: "teaching-assistant",
    title: "Laboratory Teaching Assistant",
    organization: "Faculty of Computer Science, Universitas Brawijaya",
    period: "Sep 2025 - Present",
    category: "Teaching",
    summary:
      "Assisted practical courses in Programming Fundamentals, Operating Systems, and Introduction to Computer Networks.",
    responsibilities: [
      "Guided students through Java fundamentals and OOP.",
      "Supported lab sessions using VPL, Moodle-based LMS, and Safe Exam Browser.",
      "Helped students debug, understand errors, and practice better programming habits.",
    ],
    impact: ["Improved communication and teaching clarity.", "Turned technical knowledge into accessible explanations."],
    reflection:
      "Teaching pushed me to simplify complexity and make technical knowledge easier to use.",
    values: ["Empathy", "Structure", "Usefulness"],
    image: media.assistant,
  },
  {
    slug: "tanoto-scholar",
    title: "Tanoto Scholar & TSA UB Staff",
    organization: "Tanoto Foundation / Tanoto Scholar Association UB",
    period: "2025 - Present",
    category: "Scholarship",
    summary:
      "A leadership and self-development journey through TELADAN and organizational contribution in TSA UB.",
    responsibilities: [
      "Participated in the TELADAN Lead Self learning and reflection process.",
      "Contributed to People Development and Creative Media roles.",
      "Supported AKSIS #1 logistics for a collaborative social innovation event.",
    ],
    impact: ["Clarified identity, values, and mission.", "Connected personal growth with social contribution."],
    reflection:
      "TELADAN helped me realize that leadership starts from understanding the system within myself.",
    values: ["Stability", "Empathy", "Usefulness"],
    image: media.tanoto,
  },
  {
    slug: "speaker-mentor",
    title: "Speaker & Mentor",
    organization: "Student communities and scholarship spaces",
    period: "2025 - Present",
    category: "Community",
    summary:
      "Shared knowledge and learning experiences in scholarship, technology, and student development spaces.",
    responsibilities: [
      "Organized thoughts into clearer explanations.",
      "Helped others understand topics from a more practical angle.",
      "Communicated with empathy depending on audience needs.",
    ],
    impact: ["Strengthened social intelligence and communication.", "Made knowledge more accessible for others."],
    reflection:
      "Speaking matters most when it helps someone understand something better.",
    values: ["Social Intelligence", "Empathy", "Usefulness"],
    image: media.speakerTeladan,
  },
  {
    slug: "bcc-competitive-programming",
    title: "Competitive Programming Staff",
    organization: "Basic Computing Community FILKOM UB",
    period: "Feb 2025 - Jan 2026",
    category: "Community",
    summary:
      "Developed algorithmic thinking and contributed to a programming community through competitive programming work.",
    responsibilities: [
      "Learned and practiced graph algorithms, greedy, and binary search.",
      "Contributed as intern and later staff in the Competitive Programming Department.",
    ],
    impact: ["Strengthened algorithmic foundations.", "Built consistency in technical learning."],
    reflection:
      "Competitive programming trained me to break unclear problems into smaller logical steps.",
    values: ["Structure", "Perseverance"],
  },
  {
    slug: "sman-sampit-tutor",
    title: "Informatics Olympiad Tutor",
    organization: "SMA Negeri 1 Sampit",
    period: "Jan 2025",
    category: "Teaching",
    summary:
      "Guided high school students preparing for district-level OSN Informatics through C++ fundamentals.",
    responsibilities: [
      "Taught input/output, conditionals, loops, arrays, functions, and recursion.",
      "Provided simulations and reflection sessions.",
    ],
    impact: ["Practiced teaching from fundamentals.", "Connected old competition experience with service to others."],
    reflection:
      "Mentoring reminded me that learning becomes more meaningful when it can be passed forward.",
    values: ["Usefulness", "Empathy"],
    image: media.highSchoolWinner,
  },
];

export const featuredExperiences = experiences.slice(0, 6);
