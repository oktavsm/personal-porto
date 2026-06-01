export type Certification = {
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  credentialUrl?: string;
  skills: string[];
  featured?: boolean;
};

export const certifications: Certification[] = [
  {
    title: "Belajar Penerapan Machine Learning untuk Android",
    issuer: "Dicoding Indonesia",
    issuedAt: "May 2026",
    expiresAt: "May 2029",
    credentialUrl: "https://www.dicoding.com/certificates/72ZDJDYK6ZYW",
    skills: ["TensorFlow Lite", "Android ML", "Kotlin"],
    featured: true,
  },
  {
    title: "SOI Asia Online Course: Operating the Internet",
    issuer: "SOI Asia",
    issuedAt: "Mar 2026",
    credentialUrl: "https://inxignia.soi.asia/public/assertions/sW8JUvFQSYO-uWbwwLQ52A?certId=",
    skills: ["Computer Networking", "OSPF", "Internet Operations"],
    featured: true,
  },
  {
    title: "Belajar Fundamental Aplikasi Android",
    issuer: "Dicoding Indonesia",
    issuedAt: "Mar 2026",
    expiresAt: "Mar 2029",
    credentialUrl: "https://www.dicoding.com/certificates/53XE1J9GKZRN",
    skills: ["Android Development", "Kotlin", "REST API"],
    featured: true,
  },
  {
    title: "SOI Asia Online Course: Understanding the Internet",
    issuer: "SOI Asia",
    issuedAt: "Feb 2026",
    credentialUrl: "https://inxignia.soi.asia/public/assertions/p1ATP1j9SDiXOED18955jQ?certId=",
    skills: ["Internet", "Networking"],
    featured: true,
  },
  {
    title: "Belajar Back-End Pemula dengan JavaScript",
    issuer: "Dicoding Indonesia",
    issuedAt: "Jan 2026",
    expiresAt: "Jan 2029",
    credentialUrl: "https://www.dicoding.com/certificates/NVP7JDY9VXR0",
    skills: ["Back-End Development", "Node.js"],
  },
  {
    title: "Belajar Dasar Pemrograman JavaScript",
    issuer: "Dicoding Indonesia",
    issuedAt: "Jan 2026",
    expiresAt: "Jan 2029",
    credentialUrl: "https://www.dicoding.com/certificates/ERZR2O0M2PYV",
    skills: ["JavaScript", "Node.js"],
  },
  {
    title: "Belajar Membuat Aplikasi Android untuk Pemula",
    issuer: "Dicoding Indonesia",
    issuedAt: "Dec 2025",
    expiresAt: "Dec 2028",
    credentialUrl: "https://www.dicoding.com/certificates/EYX4K5196PDL",
    skills: ["Android", "Mobile Development"],
  },
  {
    title: "Memulai Pemrograman dengan Kotlin",
    issuer: "Dicoding Indonesia",
    issuedAt: "Oct 2025",
    expiresAt: "Oct 2028",
    credentialUrl: "https://www.dicoding.com/certificates/ERZR2Y5E2PYV",
    skills: ["Kotlin"],
  },
];
