# Core System Portfolio

A personal portfolio web application built as a small CMS monorepo. The goal is not only to present projects and experiences, but also to let the portfolio owner update fast-changing content without editing code every time.

The public site is a polished portfolio frontend, while the private admin area provides CRUD tools for projects, experiences, certifications, live systems, contact links, resume versions, media assets, music tracks, and CMS copywriting sections.

## What This Project Solves

Most portfolio websites are easy to build once but inconvenient to maintain. Adding a new project, changing an experience, updating a resume, or revising copywriting often means opening the codebase again.

This project treats the portfolio as a living system:

- public visitors see a clean portfolio website;
- the owner can manage content from an admin dashboard;
- project and experience data can evolve without rebuilding pages manually;
- page copy and repeatable content blocks can be edited through CMS-like controls;
- uploaded media can be reused for project galleries, experience covers, section images, and resume files.

## Features

- Public portfolio pages:
  - Home
  - Projects
  - Project detail pages
  - Experiences
  - Experience detail pages
  - Lead Self reflection page
  - Resume
  - Live systems
  - Contact
- Admin dashboard:
  - Authentication and persistent admin session
  - Project CRUD
  - Experience CRUD
  - Certification CRUD
  - Live system CRUD
  - Contact link CRUD
  - Music track CRUD
  - Resume version upload and activation
  - Media upload and library management
  - CMS page copy editor
  - Repeatable CMS card blocks
  - Section-level media and CTA settings
  - Display ordering controls
- Content API:
  - Public read endpoints
  - Admin protected endpoints
  - Generated portfolio context endpoint for chatbot/workflow integration
- Deployment:
  - Dockerized frontend
  - Dockerized API
  - PostgreSQL via Docker Compose
  - Blue-green frontend deployment flow
  - GitHub Actions CI/CD
  - Nginx reverse proxy support

## Tech Stack

Frontend:

- React
- TypeScript
- Vite
- React Router
- CSS custom design system
- Lucide icons

Backend:

- Node.js
- Fastify
- TypeScript
- Prisma
- PostgreSQL
- Cookie/session authentication
- Multipart media uploads

Infrastructure:

- Docker
- Docker Compose
- Nginx
- GitHub Actions
- Docker Hub image publishing

## Monorepo Structure

```text
.
├── apps/
│   └── api/                 # Fastify API, Prisma schema, seeds, migrations
├── src/                     # React frontend application
│   ├── components/          # Shared UI and portfolio components
│   ├── data/                # Static fallback content and seed references
│   ├── lib/                 # Public/admin API clients and CMS helpers
│   └── pages/               # Public pages and admin dashboard
├── assets/                  # Local portfolio assets used by the frontend/seed
├── deploy/                  # Docker Compose files
├── public/                  # Public static files
├── Dockerfile               # Frontend image
├── Dockerfile.api           # API image
└── nginx.conf               # Nginx deployment template
```

## Local Development

Install dependencies:

```bash
npm install
```

Start local PostgreSQL:

```bash
npm run db:local
```

Run Prisma migrations:

```bash
npm run prisma:migrate
```

Seed initial API data:

```bash
npm run seed:api
```

Seed or resync CMS page copy only:

```bash
npm run seed:cms
```

Run the API:

```bash
npm run dev:api
```

Run the frontend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Admin: `http://localhost:5173/admin`

## Environment Variables

Copy `.env.example` into `.env` and fill the local values.

Important variables include:

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `COOKIE_SECRET`
- `CORS_ORIGIN`
- `UPLOAD_DIR`
- `PUBLIC_UPLOAD_BASE_URL`
- `MAX_UPLOAD_MB`
- `VITE_PORTFOLIO_CHAT_WEBHOOK_URL`

Production deployment uses GitHub repository secrets for Docker Hub, EC2 SSH, database credentials, API configuration, and optional production seeding.

## CMS Model

The CMS layer is intentionally small and practical.

Main editable content areas:

- `Project`
- `Experience`
- `Certification`
- `LiveSystem`
- `ContactLink`
- `MusicTrack`
- `ResumeVersion`
- `MediaAsset`
- `SitePage`
- `SiteSection`
- `ContentBlock`

The frontend still contains static fallback content. If the API is unavailable or CMS data has not been seeded yet, the public pages can still render from local fallback data.

## Seeding Policy

There are two seed commands with different purposes.

`npm run seed:api`

- Seeds the broader portfolio data.
- Creates admin account when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are provided.
- Seeds projects, experiences, certifications, systems, contact links, music, media, resume, and CMS content.
- Useful for first setup or intentional full local reset.

`npm run seed:cms`

- Seeds or resyncs CMS page sections and default content blocks.
- Useful after adding new CMS sections in code.
- Can overwrite section copy/settings with the static seed values.
- Does not overwrite existing content blocks when a section already has blocks.

For production, keep full seeding intentional. After the first production migration, prefer admin edits and only run CMS seed when new CMS sections need to be created.

## Chatbot Context Endpoint

The API exposes a generated markdown context endpoint:

```text
/api/public/portfolio-context.md
```

This endpoint summarizes live portfolio data from the database so external workflows, such as an n8n chatbot, can answer from the current portfolio state instead of an outdated static markdown file.

## Build

Build the frontend:

```bash
npm run build
```

Build the API:

```bash
npm run build:api
```

## Deployment Notes

The production setup is designed around:

- frontend image served by Nginx;
- API image running Fastify;
- PostgreSQL container with persistent volume;
- persistent upload volume;
- Nginx proxying `/api/` and `/uploads/`;
- GitHub Actions building and pushing Docker images;
- blue-green frontend container switching for safer deploys.

After deploying changes that add new CMS sections, run this once on the server:

```bash
sudo docker exec teladan-porto-api npm run seed:cms
```

Run full production seed only when intentionally resyncing initial/static portfolio data.

## Project Intention

This project is a practical portfolio system for a personal website that changes over time. It keeps the public experience simple, while giving the owner a private interface to update content, images, resume files, and storytelling without rewriting frontend code for every small change.
