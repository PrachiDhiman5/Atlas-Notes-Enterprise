# Enterprise Collaborative Notes Platform (MERN)

Production-oriented monorepo for collaborative notes, workspaces, realtime updates, uploads, and email-based auth flows.

This repository evolved from an earlier Express CRUD “Notes API” exercise; the current application lives under `client/` (Vite + React) and `server/` (Express + Socket.IO).

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, Vite 5, TailwindCSS, Redux Toolkit, React Query, TipTap, Socket.IO client |
| Backend | Node.js 20, Express, Mongoose, Socket.IO, JWT (access + refresh), Zod validation |
| Data | MongoDB |
| Email | Nodemailer (SMTP) |
| Files | Local disk or Cloudinary |

## Monorepo layout

```text
client/          # Vite + React SPA
server/          # Express API + Socket.IO
docker-compose.yml
```

## Prerequisites (local development)

1. **Node.js** 20+ and **npm** 9+.
2. **MongoDB** running locally, or a **MongoDB Atlas** connection string.
3. Optional: **Docker Desktop** (for containerized run).

---

## Local development (without Docker)

### Step 1 — Install dependencies

From the repository root:

```bash
npm install
```

### Step 2 — Environment files

1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGO_URI` (e.g. `mongodb://127.0.0.1:27017/collab_notes` or your Atlas URI).
3. Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
4. Set `SMTP_*` if you want verification and password-reset emails (optional for local testing).
5. Copy `client/.env.example` to `client/.env` and leave `VITE_API_URL` / `VITE_SOCKET_URL` unset for dev (Vite proxies `/api` and `/socket.io` to the backend).

### Step 3 — Start MongoDB

Ensure MongoDB is reachable at the URI you put in `server/.env`.

### Step 4 — Run API and client

From the repo root:

```bash
npm run dev:all
```

Or in two terminals:

```bash
npm run dev:server
npm run dev:client
```

### Step 5 — Open the app

- **Client:** http://localhost:5173  
- **API:** http://localhost:5000/api/v1  
- **Health:** http://localhost:5000/api/v1/health  

---

## Production environment checklist (server)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | Render sets this automatically; locally often `5000` |
| `MONGO_URI` | Production MongoDB URI |
| `CLIENT_URL` | Public frontend origin(s), comma-separated for CORS (e.g. `https://your-app.onrender.com`) |
| `APP_BASE_URL` | Same as the user-facing app URL (used in email links) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Strong random strings |
| `SMTP_*` | For signup verification and password reset |
| `CLOUDINARY_*` | Recommended on cloud hosts so uploads survive redeploys (otherwise local `UPLOAD_DIR` is ephemeral) |

---

## Production environment checklist (client build)

Vite inlines `VITE_*` at **build time**:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://your-api.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | `https://your-api.onrender.com` (no path; same host as Socket.IO) |

If these are wrong, the deployed SPA will call the wrong API or fail WebSocket connections.

---

## Features (high level)

- Auth: signup, login, refresh, logout, email verification, forgot/reset password  
- Notes, workspaces, members, comments, notifications  
- Realtime via Socket.IO  
- File uploads (local or Cloudinary)  
- Rate limiting, Helmet, centralized errors, health route  

---

# Docker — full walkthrough

This repo ships:

- `docker-compose.yml` — API + static frontend (nginx); MongoDB is expected on the host or Atlas via `MONGO_URI` in `server/.env`  
- `server/Dockerfile` — production Node image (`npm install --omit=dev`, `node src/server.js`)  
- `client/Dockerfile` — multi-stage build (Vite) + nginx serving `dist`  
- `client/nginx.conf` — SPA fallback to `index.html`  

### Step 1 — Install Docker

Install **Docker Desktop** (Windows/macOS) or Docker Engine + Compose on Linux. Confirm:

```bash
docker version
docker compose version
```

### Step 2 — Create `server/.env` for Docker

1. Copy `server/.env.example` to `server/.env`.
2. Set **`MONGO_URI`** to a database the container can reach:
   - **MongoDB on your machine (Windows/macOS/Linux):** use `mongodb://host.docker.internal:27017/collab_notes` (Docker Desktop) or your LAN IP instead of `localhost`, because `localhost` inside the container is not your host.
   - **MongoDB Atlas:** use your Atlas SRV string as usual.
3. Set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and optional `SMTP_*`, `CLOUDINARY_*`.
4. Set `CLIENT_URL` and `APP_BASE_URL` to where the **browser** loads the SPA. With the default compose mapping use **`http://localhost:8080`**:

   ```env
   CLIENT_URL=http://localhost:8080
   APP_BASE_URL=http://localhost:8080
   ```

### Step 3 — How the client build targets the API

Compose maps the API to **port 5001** on the host (`5001:5000` inside the container). The client image is built with:

- `VITE_API_URL=http://localhost:5001/api/v1`  
- `VITE_SOCKET_URL=http://localhost:5001`  

So you open **http://localhost:8080** for the UI and the browser calls the API on **http://localhost:5001**.

### Step 4 — Build and start

From the **repository root**:

```bash
docker compose build
docker compose up -d
```

### Step 5 — Verify

- Frontend: http://localhost:8080  
- API health: http://localhost:5001/api/v1/health  

### Step 6 — Logs

```bash
docker compose logs -f server
docker compose logs -f client
```

### Step 7 — Stop

```bash
docker compose down
```

### Optional — Rebuild client for another API URL

```bash
docker compose build --no-cache client \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  --build-arg VITE_SOCKET_URL=https://api.example.com
docker compose up -d client
```

### Optional — Add MongoDB to Compose

You can add a `mongodb` service and set `MONGO_URI=mongodb://mongodb:27017/collab_notes` for `server` if you want an all-in-one stack without host MongoDB.

---

# Deploy frontend and backend on Render

Typical setup:

1. **MongoDB Atlas** — database  
2. **Web Service** — Node API (`server/`)  
3. **Static Site** — built SPA (`client/`)  

Deploy the **API first**, then the **static site** with `VITE_*` pointing at the API URL.

---

## Part A — MongoDB Atlas

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in.  
2. Create a **project** and a **cluster** (M0 free).  
3. **Database Access** → create a database user (username + password).  
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** `0.0.0.0/0` (needed for Render; tighten later if you use private networking).  
5. **Database** → **Connect** → **Drivers** → copy the connection string and replace `<password>`.  
6. Append a database name if missing, e.g. `...mongodb.net/collab_notes?retryWrites=true&w=majority`.  
7. Use this as `MONGO_URI` on Render.

---

## Part B — Backend (Render Web Service)

1. Push this repository to GitHub (or connect GitLab/Bitbucket on Render).  
2. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.  
3. Connect the repo.  
4. Configure:
   - **Root Directory:** `server`  
   - **Runtime:** Node  
   - **Build Command:** `npm install`  
   - **Start Command:** `npm run start`  
   - **Branch:** `master` or `main` (match your GitHub default)  
5. **Environment** — set at least: `NODE_ENV`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `APP_BASE_URL`, plus `SMTP_*` / `CLOUDINARY_*` as needed (see tables above).  
6. Deploy and open `https://<your-service>.onrender.com/api/v1/health`.  
7. Optional health check path: `/api/v1/health`.

---

## Part C — Frontend (Render Static Site)

1. **New +** → **Static Site** → same repo.  
2. **Root Directory:** `client`  
3. **Build Command:** `npm install && npm run build`  
4. **Publish directory:** `dist`  
5. Build-time env: `VITE_API_URL`, `VITE_SOCKET_URL` (same pattern as production checklist).  
6. Deploy and copy the static site URL.

---

## Part D — CORS

On the **Web Service**, set `CLIENT_URL` and `APP_BASE_URL` to your **static site** origin, then redeploy the API.

---

## Part E — Checklist

1. Atlas + `MONGO_URI`  
2. API deployed → health OK  
3. Static site with `VITE_*`  
4. API `CLIENT_URL` / `APP_BASE_URL` updated  
5. Test auth and realtime  

---

## Troubleshooting (Render / Docker)

- **CORS:** `CLIENT_URL` must match the static site origin exactly.  
- **SPA API URL:** `VITE_API_URL` should end with `/api/v1`.  
- **Socket.IO:** `VITE_SOCKET_URL` is the API origin only (HTTPS on Render).  
- **Uploads on Render:** prefer Cloudinary; disk inside the container is not durable.  
- **Docker + host Mongo:** use `host.docker.internal` (or host IP), not `localhost`, in `MONGO_URI`.

---

## NPM scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev:all` | API + Vite dev server together |
| `npm run dev:server` | API only |
| `npm run dev:client` | Client only |
| `npm run build` | Client production build + server no-op build |
| `npm run start` | Start API from repo root |

---

## Author

Prachi Dhiman — B.Tech CSE; portfolio / learning project.

---

## License / status

Academic / portfolio baseline. Add automated tests and production hardening before handling real user data.
