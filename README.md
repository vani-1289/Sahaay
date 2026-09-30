# 🏛️ SAHAAY — Citizen-First Land Acquisition & Compensation Companion

> **"Your Land. Your Case. Your Information."**  
> *A unified digital governance platform empowering landowners with transparent acquisition tracking, cadastral GIS mapping, AI document intelligence, discrepancy detection, and automated grievance redressal.*

[![CI Pipeline](https://img.shields.io/badge/CI-Passing-brightgreen?style=flat-square&logo=githubactions)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![DPDP Act 2023](https://img.shields.io/badge/DPDP_Act_2023-Compliant-success?style=flat-square)](./docs/DPDP_COMPLIANCE.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

---

## 📌 Demo Credentials

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Citizen (Landowner)** | `citizen@sahaay.demo` | `password123` | Search land, view parcel timeline, compensation status, upload notices, raise grievances |
| **Land Acquisition Officer** | `officer@sahaay.demo` | `password123` | Review cases, inspect survey discrepancies, publish hearing dates, resolve grievances |
| **System Administrator** | `admin@sahaay.demo` | `password123` | Full administrative control, audit logs, system health & readiness monitoring |

---

## ✨ Key Capabilities

1. **🌾 Find My Land & Cadastral GIS Discovery**
   - Instant search by Survey Number (खसरा नं), Village (ग्राम), Tehsil, District, or Acquisition Reference.
   - Interactive Leaflet-powered GIS polygon visualization showing acquisition boundaries and project corridors.

2. **⏳ 8-Stage Statutory Timeline Tracker**
   - Tracks the full acquisition lifecycle under the **RFCTLARR Act 2013**:
     1. Social Impact Assessment (SIA) & Proposal
     2. Section 11(1) Preliminary Gazette Notice
     3. Cadastral Ground Verification & Section 15 Objections
     4. Section 19 Declaration & Award
     5. Section 30 Compensation Determination (100% Solatium + Multiplier)
     6. Rehabilitation & Resettlement (R&R) Package Sanction
     7. Land Handover & Possession (Section 38)
     8. Case Finalization & Direct Benefit Transfer (DBT)

3. **🤖 Real Document Intelligence & Discrepancy Detection Engine**
   - **Tesseract.js OCR Pipeline**: Extracts statutory notices in English and Hindi (`खसरा`, `रकबा`, `हेक्टेयर`, `धारा 11(1)`).
   - **Automated Discrepancy Detection**: Compares notified area and survey numbers against certified cadastral revenue records, calculating area mismatches and generating actionable Section 15 objection recommendations.

4. **💰 Compensation & R&R Transparency Dashboard**
   - Breakdown of Land Valuation, Asset Assessment, 100% Solatium, and 12% Additional Market Interest.
   - Real-time Public Financial Management System (PFMS) Direct Benefit Transfer (DBT) tracking.

5. **📝 Direct Grievance & Officer Redressal Workflow**
   - One-click grievance filing directly from detected document discrepancies.
   - Direct communication loop with Land Acquisition Officers (CALAO) with resolution status tracking.

6. **🌐 23 Indian Languages & Universal Accessibility**
   - Full bilingual support in Hindi (`hi`) and English (`en`), with typography support for all 22 Eighth Schedule Indian languages.
   - Fully zoom-enabled responsive design compliant with accessibility standards for rural and elderly citizens.

---

## 🏗️ System Architecture

```
                     ┌───────────────────────────────────────────────────┐
                     │          SAHAAY Modern Web Frontend (SPA)         │
                     │    React 18 • TypeScript • Tailwind • Vite        │
                     │  23 Indian Languages & Scripts • Leaflet GIS Maps │
                     │              Deployed on: Vercel                  │
                     └─────────────────────────┬─────────────────────────┘
                                               │ HTTPS / REST
                                               ▼
                     ┌───────────────────────────────────────────────────┐
                     │          SAHAAY Backend API Server                │
                     │       Node.js • Express • TypeScript • Zod        │
                     │  Rate Limiting • Pino Logger • Compression • RBAC │
                     │          Deployed on: Render / Railway / Fly.io   │
                     └───────┬───────────────────┬───────────────────┬───┘
                             │                   │                   │
                             ▼                   ▼                   ▼
    ┌───────────────────────────────┐ ┌───────────────────┐ ┌───────────────────┐
    │ Managed PostgreSQL + PostGIS  │ │ AI & OCR Pipeline │ │   Cloud Storage   │
    │  Neon / Supabase / RDS        │ │ Tesseract.js OCR  │ │ Cloudflare R2 /   │
    │  Prisma ORM (Multi-Tenant)    │ │ Bilingual RegEx   │ │ AWS S3 / Supabase │
    └───────────────────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20.x or v22.x LTS
- **npm** v10+

### Option A: Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/sahaay.git
cd sahaay

# 2. Install all dependencies (Root, Server, and Client)
npm run install:all

# 3. Initialize environment file
cp .env.example .env

# 4. Generate Prisma Client & Seed Demo Records
npm run db:generate
npm run db:push
npm run db:seed

# 5. Start unified development server (Backend on :5000, Frontend on :5173)
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Option B: Docker Compose Setup

```bash
# Start full stack container cluster with PostgreSQL
docker compose up --build -d
```

---

## 🧪 Verification & CI/CD Pipeline

SAHAAY includes a complete quality assurance suite:

```bash
# Run static typecheck (0 errors across server & client)
npm run typecheck

# Run code linter
npm run lint

# Run end-to-end automated test suite (42/42 checks)
npm test

# Run full CI validation pipeline
npm run ci:check
```

---

## ☁️ Production Deployment Architecture

For detailed step-by-step instructions, see our comprehensive [Deployment & Environment Configuration Guide](./docs/DEPLOYMENT.md).

| Component | Recommended Free-Tier Provider | Setup Details |
|---|---|---|
| **Frontend Client** | **Vercel** | Set root directory to `client/`. Pre-configured `vercel.json` provides seamless SPA routing. Configure `VITE_API_BASE_URL` in Vercel Environment Variables. |
| **Backend API** | **Render** / **Railway** | Build using `server/Dockerfile` or native Node 22 runtime. Configure `NVIDIA_API_KEY` (`const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;`), `AI_PROVIDER=nvidia`, and `CORS_ORIGIN`. |
| **AI Engine** | **NVIDIA NIM** | Model: `meta/llama-3.2-90b-vision-instruct`. Authenticated securely via `NVIDIA_API_KEY` environment variable only. |
| **Database** | **Neon** / **Supabase** | Serverless Managed PostgreSQL. Set `DATABASE_URL` and run `npm run db:migrate:deploy` on startup. |
| **Storage** | **Cloudflare R2** / **AWS S3** | S3-compatible zero-egress object storage. Set `STORAGE_PROVIDER=s3` with your access keys. |

---

## 🛡️ Security & Privacy Compliance

- **DPDP Act (2023) Compliance**: Masked Aadhaar storage, encrypted document attachments, and affirmative citizen consent. Read our [DPDP Compliance Guide](./docs/DPDP_COMPLIANCE.md).
- **IDOR Protection**: All sensitive case, document, and grievance routes are protected by role-based authorization checks preventing cross-citizen data exposure.
- **DDoS & Brute Force Prevention**: Integrated `express-rate-limit` protecting authentication (15 reqs/15 min), uploads, and general API endpoints.
- **Production Secret Guard**: Backend refuses to start in `NODE_ENV=production` if an insecure default or weak `JWT_SECRET` is detected.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
