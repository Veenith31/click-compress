# Production deployment — Click-Compress

## Recommended free stack (best for Next.js + SEO)

| Service | Role | Free tier | Why |
|---------|------|-----------|-----|
| **[Vercel](https://vercel.com)** | Host Next.js app | Hobby plan | Native Next.js, global CDN, automatic HTTPS, great Core Web Vitals |
| **[Neon](https://neon.tech)** | PostgreSQL database | 0.5 GB storage, serverless | Works with Vercel, branching, connection pooling |
| **[Cloudflare R2](https://developers.cloudflare.com/r2/)** | Encrypted file blobs | 10 GB / month | S3-compatible, no egress fees to Cloudflare CDN |
| **[Cloudflare](https://cloudflare.com)** | DNS + CDN | Free | Fast DNS, DDoS protection, optional proxy |
| **[Google Search Console](https://search.google.com/search-console)** | SEO indexing | Free | Submit sitemap, monitor rankings |

**Alternative combos (also free to start):**

- Vercel + **Supabase** (Postgres + Storage in one dashboard)
- **Railway** (Postgres + app hosting, $5 credit/month)
- **Render** (web service + Postgres free tiers with cold starts)

## Architecture in production

```
Browser → Vercel (Next.js)
              ├── Neon PostgreSQL  (users, file metadata)
              └── Cloudflare R2    (encrypted .enc blobs)
```

Local dev without `DATABASE_URL` continues using `.data/` on disk.

## Setup steps

### 1. PostgreSQL (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string → `DATABASE_URL` in Vercel env vars
3. Push schema:

```bash
cp .env.example .env.local
# paste DATABASE_URL into .env.local
npm run db:push
```

### 2. Object storage (Cloudflare R2)

1. Create an R2 bucket (e.g. `click-compress-files`)
2. Create API token with Object Read & Write
3. Set env vars:

```
S3_BUCKET=click-compress-files
S3_REGION=auto
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=<r2_access_key>
AWS_SECRET_ACCESS_KEY=<r2_secret_key>
```

### 3. Secrets

```bash
openssl rand -hex 32   # AUTH_SECRET
openssl rand -hex 32   # FILE_ENCRYPTION_SECRET (different from AUTH_SECRET)
```

### 4. Deploy to Vercel

1. Push repo to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Add all env vars from `.env.example`
4. Set `NEXT_PUBLIC_SITE_URL` to your custom domain
5. Deploy → run `npm run db:push` locally against production DATABASE_URL once

### 5. Custom domain

1. Add domain in Vercel project settings
2. Point DNS (Cloudflare recommended) to Vercel
3. Enable HTTPS (automatic on Vercel)

## Migrate existing local data

If you have users/files in `.data/` from development:

```bash
DATABASE_URL=postgresql://... npm run migrate:local
```

Requires `DATABASE_URL` and S3 vars (or local blob fallback under `.data/blobs/`).

## Google Search ranking checklist

Ranking takes weeks–months; technical SEO is the foundation:

1. **Set `NEXT_PUBLIC_SITE_URL`** — powers sitemap, canonical URLs, Open Graph
2. **Submit sitemap** — `https://your-domain.com/sitemap.xml` in Google Search Console
3. **Verify site** — DNS or HTML file in Search Console
4. **Performance** — Vercel CDN + Next.js image optimization; aim for green Core Web Vitals
5. **Content** — target keywords on `/capabilities`, `/how-it-works` (e.g. “compress PDF online free”)
6. **Structured data** — JSON-LD WebSite + SoftwareApplication (included in layout)
7. **Backlinks** — list on Product Hunt, GitHub README, dev communities
8. **HTTPS + mobile** — required; already handled by Vercel

**Note:** No host guarantees “top” Google results. Focus on speed, useful content, and Search Console indexing.

## Environment reference

See `.env.example` for all variables.

| Variable | Production |
|----------|------------|
| `DATABASE_URL` | Required |
| `AUTH_SECRET` | Required |
| `FILE_ENCRYPTION_SECRET` | Recommended |
| `S3_*` / `AWS_*` | Required for file storage at scale |
| `NEXT_PUBLIC_SITE_URL` | Required for SEO |

## Database schema

Managed by Drizzle ORM in `lib/db/schema.ts`:

- `users` — accounts (scrypt password hashes)
- `user_files` — metadata + `storage_key` pointing to encrypted blob

Commands:

```bash
npm run db:push      # apply schema to DATABASE_URL
npm run db:generate  # create migration files after schema changes
npm run db:studio    # browse data (dev)
```
