# 🏛️ SAHAAY — System Architecture & Deployment Blueprint

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

## 1. Component Overview

### Frontend Client (`/client`)
- Built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.
- **State Management**: **Zustand** (auth & session) + **TanStack Query** (caching and server state).
- **GIS Mapping**: **Leaflet** & **React-Leaflet** for cadastral parcel visualization and acquisition corridor overlays.
- **Accessibility & i18n**: Multilingual support for Hindi (`hi`), English (`en`), and 21 regional languages with dynamic typography (`Noto Sans Devanagari`, `Inter`).

### Backend API Server (`/server`)
- Built with **Express**, **TypeScript**, **Zod**, **Helmet**, **Pino**, and **Compression**.
- **Security**: Rate limiting (100 reqs/15 min on API, 15 attempts on auth, 25/15 min on uploads), IDOR-protected controllers, and JWT session handling.
- **Document Intelligence**: Real **Tesseract.js OCR** + land record regex parser for Survey/Khasra numbers, land area (ha/acres), gazette sections (11, 15, 19), and discrepancy detection against cadastral databases.
- **Storage Layer**: Pluggable storage architecture (`LocalStorageService` and `S3StorageService` supporting AWS S3, Cloudflare R2, Supabase Storage, and MinIO).

---

## 2. API Reference

| Endpoint | Method | Role / Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Server liveness and configuration metadata |
| `/api/health/ready` | GET | Public | Database readiness probe |
| `/api/auth/register` | POST | Public (Rate Limited) | Register a new Citizen account |
| `/api/auth/login` | POST | Public (Rate Limited) | Citizen/Officer login (returns JWT) |
| `/api/auth/me` | GET | Authenticated | Get current user profile and session data |
| `/api/auth/verify-pan` | POST | Public / Auth | Validate PAN card format & entity type |
| `/api/auth/verify-face` | POST | Authenticated | Biometric facial match between PAN and live selfie |
| `/api/parcels/search` | GET | Public / Auth | Search cadastral land parcels by survey/village/ref |
| `/api/parcels/:id` | GET | Public / Auth | Get parcel details and acquisition geometry |
| `/api/cases/:id` | GET | Authenticated (IDOR Guard) | Get full acquisition case details (Citizen-locked) |
| `/api/cases/:id/timeline` | GET | Authenticated (IDOR Guard) | Lifecycle milestones (SIA, Sec 11, Award, Compensation) |
| `/api/cases/:id/compensation` | GET | Authenticated (IDOR Guard) | Section 30 valuation, 100% Solatium, PFMS DBT status |
| `/api/cases/:id/rr` | GET | Authenticated (IDOR Guard) | Rehabilitation & Resettlement package status |
| `/api/documents/upload` | POST | Authenticated (Rate Limited) | Upload land notice, trigger OCR & discrepancy check |
| `/api/documents/my` | GET | Authenticated | Get all documents uploaded by citizen |
| `/api/grievances` | POST | Authenticated | Raise a Section 15 objection or grievance |
| `/api/grievances` | GET | Authenticated (Role Filtered)| Get grievances for current citizen or officer |
| `/api/officer/dashboard` | GET | `OFFICER` / `ADMIN` | Officer summary metrics, pending cases, disputes |
| `/api/officer/cases/:id` | PATCH | `OFFICER` / `ADMIN` | Update case stage (e.g. `NOTIFICATION` -> `VERIFICATION`) |
| `/api/officer/grievances/:id`| PATCH | `OFFICER` / `ADMIN` | Add formal officer response & resolve grievance |

---

## 3. Production Deployment Guide

### Free-Tier Production Stack:
- **Frontend**: **Vercel** (`client/` root, SPA rewrites in `client/vercel.json`, `VITE_API_BASE_URL=https://api.yourdomain.com/api`)
- **Backend API**: **Render** / **Railway** (`server/Dockerfile` or native Node 22 runtime)
- **Database**: **Neon** / **Supabase** (Serverless Managed PostgreSQL)
- **Document Storage**: **Cloudflare R2** / **AWS S3** / **Supabase Storage** (S3-compatible bucket)
