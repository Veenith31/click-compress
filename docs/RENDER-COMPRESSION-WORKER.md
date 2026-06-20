# Render compression worker ($0/month, no credit card)

Deploy Ghostscript + FFmpeg on **Render’s free web service**. No Oracle account or card verification — connect GitHub and deploy in ~15 minutes.

```
clickcompress.com (Vercel)              →  UI + browser compression
        ↓ browser POST /compress
click-compress-worker.onrender.com      →  Docker: Node + gs + ffmpeg
```

**Trade-off:** Free services **sleep after 15 min idle**. First request after sleep takes **30–60 seconds** to wake up. The UI shows “Worker is starting…” during this.

---

## What you get

| Item | Free tier |
|------|-----------|
| Cost | $0 (no credit card required) |
| Hours | 750/month (enough for one service 24/7) |
| RAM | 512 MB |
| PDF (Ghostscript) | Works well |
| Video (FFmpeg) | Small files only; large videos may fail on 512 MB |
| Max upload | 30 MB (set in `render.yaml`) |
| Custom domain | Yes — e.g. `compression.clickcompress.com` |

---

## 1. Push worker code to GitHub

Make sure your repo includes:

- `compression-worker/` (Dockerfile, server, compress logic)
- `render.yaml` (optional Blueprint; or configure manually)

```bash
git add compression-worker render.yaml .dockerignore docs/RENDER-COMPRESSION-WORKER.md
git commit -m "Add Render compression worker deployment"
git push origin main
```

---

## 2. Create Render account

1. Go to [render.com](https://render.com) → **Get Started for Free**
2. Sign up with **GitHub** (easiest — links your repo)
3. No credit card needed for free tier

---

## 3. Deploy the worker

### Option A — Blueprint (fastest)

1. Render Dashboard → **New +** → **Blueprint**
2. Connect repo `Veenith31/click-compress` (or your fork)
3. Render reads `render.yaml` and creates `click-compress-worker`
4. Click **Apply** → wait for first build (~5–10 min; installs gs + ffmpeg in Docker)

### Option B — Manual web service

1. **New +** → **Web Service**
2. Connect the same GitHub repo
3. Settings:

| Field | Value |
|-------|-------|
| Name | `click-compress-worker` |
| Region | Singapore or closest to India |
| Branch | `main` |
| Runtime | **Docker** |
| Dockerfile path | `compression-worker/Dockerfile` |
| Docker context | `.` (repo root) |
| Instance type | **Free** |
| Health check path | `/health` |

4. **Environment variables:**

| Key | Value |
|-----|-------|
| `WORKER_MAX_UPLOAD_MB` | `30` |
| `WORKER_ALLOWED_ORIGINS` | `https://clickcompress.com,https://www.clickcompress.com,http://localhost:3000` |

5. **Create Web Service** → wait for deploy

---

## 4. Verify the worker

When deploy is **Live**, open:

```
https://click-compress-worker.onrender.com/health
```

Expected:

```json
{"ok":true,"gs":true,"ffmpeg":true}
```

First load after idle may take ~60s — that’s normal.

---

## 5. Connect Vercel

In **Vercel → click-compress → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_COMPRESSION_WORKER_URL` | `https://click-compress-worker.onrender.com` |

Redeploy Vercel (or push any commit to `main`).

---

## 6. Optional — custom subdomain

Use `compression.clickcompress.com` instead of `.onrender.com`:

1. Render → your service → **Settings → Custom Domains**
2. Add `compression.clickcompress.com`
3. Render shows a **CNAME** target (e.g. `click-compress-worker.onrender.com`)
4. Namecheap → **Advanced DNS**:

| Type | Host | Value |
|------|------|-------|
| CNAME | `compression` | `click-compress-worker.onrender.com` |

5. Wait for SSL (automatic on Render)
6. Update Vercel env:

```
NEXT_PUBLIC_COMPRESSION_WORKER_URL=https://compression.clickcompress.com
```

Also add the custom domain to `WORKER_ALLOWED_ORIGINS` on Render if you use it.

---

## 7. Test end-to-end

1. Open [clickcompress.com/compress](https://www.clickcompress.com/compress)
2. Choose **High impact local**
3. Upload a **5–15 MB PDF**
4. First try after idle: UI may show **“Worker is starting…”** for ~30–60s
5. Then **“Uploading to compression worker (Ghostscript)…”**
6. Download compressed file

---

## Free tier limits (know these)

| Limit | Detail |
|-------|--------|
| Sleep | After **15 min** with no requests |
| Cold start | **30–60 s** on first request after sleep |
| RAM | **512 MB** — keep uploads ≤ 30 MB; video may OOM on big files |
| Build minutes | 500/month — avoid redeploying constantly |
| Bandwidth | 100 GB/month outbound |

**Tip:** A free [UptimeRobot](https://uptimerobot.com) ping to `/health` every 14 min keeps the worker awake — optional; not required for low traffic.

---

## Updates

Render auto-deploys on push to `main` if enabled (**Settings → Auto-Deploy**).

Manual redeploy: **Manual Deploy → Deploy latest commit**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Check **Logs** tab; ensure Dockerfile path is `compression-worker/Dockerfile`, context `.` |
| CORS error in browser | Add your origin to `WORKER_ALLOWED_ORIGINS` on Render |
| 502 / timeout | Worker waking up — wait 60s and retry |
| PDF works, video fails | 512 MB RAM limit — use smaller video or upgrade Render to Starter ($7/mo) |
| `gs: false` in health | Rebuild service; Ghostscript install failed in Docker |
| 413 upload error | Lower file size or raise `WORKER_MAX_UPLOAD_MB` (careful with RAM) |

---

## Render vs Oracle

| | Render free | Oracle Always Free |
|--|-------------|-------------------|
| Credit card | Not required | Required (verification) |
| Setup time | ~15 min | ~1–2 hours |
| Cold start | 30–60 s after idle | None (always on) |
| RAM | 512 MB | 6 GB |
| Best for | Getting live quickly | Heavy video, 24/7 production |

---

## Checklist

- [ ] Render account + GitHub connected
- [ ] Web service deployed from Docker
- [ ] `/health` returns `gs: true`, `ffmpeg: true`
- [ ] `NEXT_PUBLIC_COMPRESSION_WORKER_URL` set on Vercel
- [ ] Vercel redeployed
- [ ] PDF compression works on clickcompress.com
