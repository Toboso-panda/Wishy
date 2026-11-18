# Wishy 🎄

**Wishy** is a self-hosted family gift list app. Create family events, share wish lists, and coordinate reservations so nobody buys the same gift twice — while keeping the surprise for the recipient.

Built with Next.js 15, Prisma, and PostgreSQL. Interface available in **Catalan** and **Spanish**.

---

## ✨ Features

- **Family events** — create events (Christmas, birthdays, etc.) and invite everyone with a single link.
- **Per-member or shared lists** — each member can have their own list, or one shared list for the whole event.
- **Gift cards** — add name, description, image, price, priority, category and notes.
- **Reservations** — mark a gift as taken, shared (multiple contributors) or "needs help" (target number of people).
- **Surprise mode** — hides reservation status from the recipient while keeping it visible to other guests.
- **Family profiles** — create profiles without an account (e.g. for kids) and claim them later.
- **Responsibilities** — assign one or more caretakers per profile, with optional list visibility.
- **Essentials & ordering** — star essential gifts and reorder them with arrows.
- **Multilingual** — Catalan and Spanish, switchable from the top bar.
- **Docker-ready** — one `docker compose up` and you're running.

---

## 🚀 Quick start (Docker)

```bash
git clone https://github.com/Toboso-panda/Wishy.git
cd Wishy
cp .env.example .env
# generate a session secret
openssl rand -hex 32   # paste into AUTH_SECRET
# (recommended) change POSTGRES_PASSWORD
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Long random secret for sessions (`openssl rand -hex 32`) |
| `POSTGRES_USER` | Postgres user (default `wishlist`) |
| `POSTGRES_PASSWORD` | Postgres password |
| `POSTGRES_DB` | Postgres database (default `wishlist`) |
| `COOKIE_SECURE` | `true` if served over HTTPS |
| `UPLOAD_DIR` | Uploads directory (default `./uploads`) |
| `PORT` | App port (default `3000`) |

Data persists in the `pgdata` and `uploads` Docker volumes. Migrations run automatically on startup.

> To wipe everything (including uploaded images), run `docker compose down -v` once before restarting.

---

## 🛠 Local development

Requires Node.js 22 and PostgreSQL.

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Type-check with `npm run lint` (`tsc --noEmit`).

---

## 🐳 Deploying to a NAS

The image can be built once and loaded on the NAS:

```bash
# on your machine
docker build -t wishy-app:latest .
docker save -o wishy-nas.tar wishy-app:latest postgres:16-alpine

# on the NAS
docker load -i wishy-nas.tar
# use docker-compose.nas.yml (image instead of build) and start
docker compose -f docker-compose.nas.yml up -d
```

Caddy / reverse-proxy example:

```caddyfile
wishy.example.com {
    reverse_proxy 127.0.0.1:5678
}
```

---

## 📂 Project structure

```
src/
  app/              # Next.js App Router pages, server actions, global CSS
  components/
    layout/         # Top bar (with the snow cap) and footer
    auth/ events/ items/ i18n/ ui/
  lib/              # db, session, permissions, uploads
    i18n/           # locale helpers and the Catalan → Spanish dictionary
prisma/         # schema & migrations
Dockerfile
docker-compose.yml
```

---

## 🤝 Contributing

Pull requests are welcome. Please keep changes consistent with the existing Catalan/Spanish UI and run `npm run lint` before submitting.

## 📄 License

Private project — all rights reserved.
EOF
echo "README written"