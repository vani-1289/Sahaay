# SAHAAY Deployment & Environment Configuration Guide

This guide provides complete instructions for deploying the **SAHAAY** Citizen-First Land Acquisition & Compensation Companion to production platforms (Vercel and Render/Cloud Providers) with secure, environment-variable-only authentication for **NVIDIA NIM**.

---

## 🔐 1. NVIDIA NIM Authentication Model

SAHAAY integrates **NVIDIA NIM** (`meta/llama-3.2-90b-vision-instruct`) via standard OpenAI-compatible completions for multilingual document classification, plain-language legal explanation, and statutory analysis.

### Strict Security Principles:
- **Zero Hardcoding**: Secrets and API keys are never stored in source code, client-side bundles, configuration files, or Git history.
- **Environment Variable Driven**: The API key is loaded strictly at runtime from the system environment:
  ```typescript
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  ```
- **Backend Isolation**: Client-side single-page applications (SPAs) communicate exclusively through the secure SAHAAY backend (`/api/ai/explain-document` and `/api/ai/explain-document/stream`). The `NVIDIA_API_KEY` is never exposed to browser runtimes.

---

## 🚀 2. Vercel Environment Variable Configuration

The SAHAAY frontend is pre-configured for zero-configuration single-page application (SPA) deployment on **Vercel**.

### Step-by-Step Setup:

1. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
   - Select your SAHAAY Git repository.
   - Root Directory: `./` (or `client` if deploying as a standalone frontend project).

2. **Configure Environment Variables**:
   In the Vercel project deployment screen (or under **Project Settings -> Environment Variables**), add the following variables:

   | Variable Name | Environment | Value | Description |
   |---|---|---|---|
   | `VITE_API_BASE_URL` | Production, Preview, Development | `https://sahaay-7tg0.onrender.com/api` (or your backend URL) | The public URL of your SAHAAY backend API. |
   | `VITE_DEFAULT_LANGUAGE` | Production, Preview, Development | `en` (or `hi`) | Default UI localization code. |

   > **Important Security Note on Client Variables**:
   > Never prefix `NVIDIA_API_KEY` with `VITE_`. Vercel/Vite bundles any `VITE_*` variables into client-side JavaScript accessible by any browser visitor. All NVIDIA NIM calls are executed server-side.

3. **If using Vercel Serverless Functions / Next.js rewrites**:
   - If you deploy backend API routes or serverless endpoints to Vercel:
     1. Go to **Project Settings** -> **Environment Variables**.
     2. Add:
        - **Key**: `NVIDIA_API_KEY`
        - **Value**: `nvapi-your-valid-nvidia-api-key`
        - **Environment**: Check **Production**, **Preview**, and **Development**.
     3. Add:
        - **Key**: `AI_PROVIDER`
        - **Value**: `nvidia`
     4. Click **Save** and trigger a redeployment.

4. **Verify Deployment**:
   - Visit your Vercel deployment URL (e.g., `https://sahaay-murex.vercel.app`).
   - The pre-configured `vercel.json` automatically handles SPA route fallbacks (`index.html`) and proxy rewrites to your backend service.

---

## 🖥️ 3. Backend Deployment (Render / Docker / Linux VPS)

The SAHAAY backend server runs on Node.js 20+ and communicates with PostgreSQL (Neon / Supabase / local) and NVIDIA NIM.

### Setting Environment Variables in Render:

1. Navigate to your Web Service in the [Render Dashboard](https://dashboard.render.com).
2. Go to the **Environment** tab.
3. Under **Environment Variables**, add:
   - `NVIDIA_API_KEY`: Paste your NVIDIA NIM API key (starts with `nvapi-...`).
   - `AI_PROVIDER`: `nvidia`
   - `DATABASE_URL`: `postgresql://username:password@your-neon-host/sahaay_db?sslmode=require`
   - `JWT_SECRET`: Generate a secure random 64-character secret (`openssl rand -hex 32`)
   - `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://sahaay-murex.vercel.app`)
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
4. Click **Save Changes**. Render will automatically trigger a rolling redeploy.

---

## 🛠️ 4. Local Development Configuration

To run SAHAAY locally with NVIDIA NIM integration:

1. Copy the template:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set your key:
   ```env
   AI_PROVIDER=nvidia
   NVIDIA_API_KEY=nvapi-your-test-key-here
   ```

3. Ensure `.env` is ignored by Git:
   ```bash
   git status
   # .env must NOT appear in untracked or staged files
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

5. Test the NVIDIA NIM streaming integration:
   - Open [http://localhost:5173/intelligence](http://localhost:5173/intelligence).
   - Upload any sample statutory notice or Khasra document.
   - Observe live real-time multilingual streaming analysis powered by `meta/llama-3.2-90b-vision-instruct`.

---

## 🛡️ 5. Pre-Commit Security Checklist

Before pushing changes to GitHub or triggering CI/CD:
- [x] Run `git status` to verify no `.env` or `.env.*` files are staged.
- [x] Search repository for sensitive tokens (`nvapi-`, `sk-`, `postgres://password`).
- [x] Verify `server/src/ai/openai.service.ts` reads `const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;`.
- [x] Verify frontend builds with zero secrets exposed: `npm --prefix client run build`.
