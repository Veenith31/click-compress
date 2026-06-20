# GCP compression worker ($0/month forever — e2-micro)

Run Ghostscript + FFmpeg on **Google Cloud Always Free** `e2-micro`. Always on (no Render cold starts), 1 GB RAM, $0 VM cost if you stay in a free US region.

```
clickcompress.com (Vercel)              →  UI + browser compression
        ↓ browser POST /compress
compression.clickcompress.com (GCP VM)  →  Docker: Node + gs + ffmpeg
```

**Recommended for:** ~2 GB/month total uploads, PDF-heavy traffic, $0 long-term.

---

## What you get (Always Free)

| Item | Limit |
|------|--------|
| VM | 1× `e2-micro` (1 GB RAM, 2 shared vCPU) |
| Disk | 30 GB standard persistent disk |
| Regions | **us-central1**, **us-east1**, **us-west1** only |
| VM cost | **$0/month** (forever, if configured correctly) |
| Egress | ~1 GB/month free, then ~$0.12/GiB |
| Card | Required for billing verification (not charged if within free tier) |

At **~2 GB uploads/month**, expect **~$0/month** total.

---

## 1. Create GCP account

1. Go to [cloud.google.com/free](https://cloud.google.com/free)
2. Sign up with **veeniths31@gmail.com**
3. Add debit/credit card (identity verification — enable **international payments** on your card if in India)
4. You get **$300 credit for 90 days** (bonus; the e2-micro stays free after credits expire)

---

## 2. Create the VM (critical settings)

1. Console → **Compute Engine** → **VM instances** → **Create instance**

| Field | Value |
|-------|--------|
| Name | `click-compress-worker` |
| Region | **us-central1** (Iowa) — or us-east1 / us-west1 |
| Zone | Any in that region (e.g. `us-central1-a`) |
| Machine type | **E2 → e2-micro** |
| Boot disk | **Ubuntu 22.04 LTS**, **Standard persistent disk**, **30 GB** |
| Firewall | Check **Allow HTTP traffic** and **Allow HTTPS traffic** |

2. **Advanced options → Networking**
   - Leave default network
   - Optional: reserve a **static external IP** (free while VM is running)

3. **Security → SSH keys** — add your Mac public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   (Generate with `ssh-keygen -t ed25519` if needed.)

4. Click **Create**

Note the **External IP** (e.g. `34.x.x.x`).

---

## 3. Firewall (if HTTP/HTTPS doesn’t work)

**VPC network → Firewall → Create rule**

| Field | Value |
|-------|--------|
| Name | `allow-compression-worker` |
| Targets | All instances |
| Source | `0.0.0.0/0` |
| Protocols | tcp:22, tcp:80, tcp:443 |

Default “allow-http” / “allow-https” rules often suffice if you checked those boxes at create time.

---

## 4. SSH into the VM

From your Mac:

```bash
ssh YOUR_USERNAME@EXTERNAL_IP
```

(GCP shows the username in the VM details, often your Google account prefix or `ubuntu`.)

---

## 5. Bootstrap the worker (one command)

On the VM:

```bash
curl -fsSL https://raw.githubusercontent.com/Veenith31/click-compress/main/scripts/gcp-bootstrap.sh | bash
```

Or clone and run locally:

```bash
git clone https://github.com/Veenith31/click-compress.git
cd click-compress
bash scripts/gcp-bootstrap.sh
```

This installs Docker, clones the repo, builds the worker, and starts it on `127.0.0.1:8080`.

Verify:

```bash
curl -s http://127.0.0.1:8080/health
# {"ok":true,"gs":true,"ffmpeg":true}
```

---

## 6. DNS (Namecheap)

**Advanced DNS** for `clickcompress.com`:

| Type | Host | Value |
|------|------|-------|
| A | `compression` | `YOUR_GCP_EXTERNAL_IP` |

Wait 5–30 minutes. Test:

```bash
dig +short compression.clickcompress.com
```

---

## 7. HTTPS with nginx + Let’s Encrypt

On the VM:

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/compression`:

```nginx
server {
    listen 80;
    server_name compression.clickcompress.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name compression.clickcompress.com;

    client_max_body_size 25M;

    ssl_certificate     /etc/letsencrypt/live/compression.clickcompress.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/compression.clickcompress.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

Enable and get certificate:

```bash
sudo ln -sf /etc/nginx/sites-available/compression /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo certbot --nginx -d compression.clickcompress.com
sudo nginx -t && sudo systemctl reload nginx
```

Test from your Mac:

```bash
curl -s https://compression.clickcompress.com/health
```

---

## 8. Connect Vercel

**Vercel → click-compress → Settings → Environment Variables**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_COMPRESSION_WORKER_URL` | `https://compression.clickcompress.com` |

Remove or replace the old Render URL. **Redeploy** Vercel.

---

## 9. Turn off Render (optional)

If you no longer use Render:

1. [dashboard.render.com](https://dashboard.render.com) → `click-compress-worker` → **Settings → Delete Web Service**
2. Saves confusion and avoids hitting an old slow worker URL

---

## 10. Updates

SSH to the VM:

```bash
cd ~/click-compress
git pull
cd compression-worker
docker compose -f docker-compose.gcp.yml up -d --build
```

---

## Staying at $0 — checklist

- [ ] Machine type is **e2-micro** (not e2-small)
- [ ] Region is **us-central1**, **us-east1**, or **us-west1**
- [ ] Boot disk is **Standard** (not SSD), **≤ 30 GB**
- [ ] Only **one** e2-micro running
- [ ] Total egress stays low (~2 GB/month uploads → ~$0)
- [ ] Set **Budget alert** in GCP: Billing → Budgets → e.g. ₹100 / $1 alert

GCP does **not** auto-charge aggressively after trial, but set a budget alert anyway.

---

## Performance vs Render

| | Render free | GCP e2-micro |
|--|-------------|--------------|
| Cold start | 30–60 s | **None** |
| RAM | 512 MB | **1 GB** |
| PDF | OK | **Faster** |
| Video | Often fails | Small files OK (≤ ~25 MB) |
| Region | Singapore option | **US only** (free tier) |

Users in India will have higher latency to a US VM than Render Singapore, but **no sleep** usually feels faster overall.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| VM costs money | Wrong region or machine type — recreate as e2-micro in us-central1 |
| CORS error | Add origin to `WORKER_ALLOWED_ORIGINS` in `docker-compose.gcp.yml` |
| 502 from nginx | `docker compose -f docker-compose.gcp.yml ps` — restart worker |
| OOM on video | Lower `WORKER_MAX_UPLOAD_MB` to 15; use PDF or smaller video |
| Card declined | Enable international payments (same as Oracle issue) |

---

## Quick checklist

- [ ] GCP account + e2-micro VM in **us-central1**
- [ ] Bootstrap script → `/health` shows `gs: true`, `ffmpeg: true`
- [ ] A record `compression` → VM IP
- [ ] HTTPS on `compression.clickcompress.com`
- [ ] Vercel `NEXT_PUBLIC_COMPRESSION_WORKER_URL` updated + redeployed
- [ ] Test PDF on clickcompress.com (High impact local mode)
