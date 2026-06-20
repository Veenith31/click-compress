# Oracle Cloud compression worker ($0/month)

Run Ghostscript + FFmpeg on an **Oracle Cloud Always Free** ARM VM. Your Vercel site stays the UI; large PDFs and videos upload **directly from the browser** to the worker, bypassing Vercel’s ~4.5 MB serverless limit.

```
clickcompress.com (Vercel)     →  UI + small in-browser compression
        ↓ browser POST /compress
compression.clickcompress.com  →  Docker: Node + gs + ffmpeg (Oracle VM)
```

---

## What you need

| Item | Cost |
|------|------|
| Oracle Always Free ARM VM (1 OCPU, 6 GB RAM) | $0 |
| Subdomain DNS A record | $0 (Namecheap) |
| Vercel (existing) | $0 hobby |
| Let’s Encrypt TLS | $0 |

Time: about **1–2 hours** first time.

---

## 1. Oracle Cloud account + VM

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (credit card for verification; Always Free resources stay $0).
2. **Compute → Instances → Create instance**
   - Name: `click-compress-worker`
   - **Image:** Ubuntu 22.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` — **1 OCPU, 6 GB RAM** (Always Free eligible)
   - **Networking:** assign a public IPv4
   - **SSH keys:** add your public key (`~/.ssh/id_ed25519.pub` or generate with `ssh-keygen -t ed25519`)
3. Create the instance and note the **public IP** (e.g. `129.146.x.x`).

### Open ports (Oracle VCN)

Default Ubuntu only needs SSH (22) and HTTPS (443) via nginx.

1. **Networking → Virtual cloud networks → your VCN → Security Lists → Default Security List**
2. Add **Ingress** rules:
   - TCP **22** from your IP (SSH)
   - TCP **80** from `0.0.0.0/0` (Let’s Encrypt + redirect)
   - TCP **443** from `0.0.0.0/0` (HTTPS)

Also check the instance **subnet** security list if traffic is still blocked.

---

## 2. SSH into the VM

```bash
ssh ubuntu@YOUR_VM_IP
```

---

## 3. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# log out and back in so docker group applies
exit
```

SSH back in, then:

```bash
docker --version
```

---

## 4. Deploy the worker

### Option A — clone the repo (recommended)

```bash
git clone https://github.com/Veenith31/click-compress.git
cd click-compress/compression-worker
docker compose up -d --build
```

### Option B — copy only the worker folder

From your laptop:

```bash
scp -r compression-worker ubuntu@YOUR_VM_IP:~/click-compress-worker
```

On the VM, place it so `docker-compose.yml` can build from repo root, or build manually:

```bash
cd ~
git clone https://github.com/Veenith31/click-compress.git   # smallest path: full clone
cd click-compress/compression-worker
docker compose up -d --build
```

### Verify locally on the VM

```bash
curl -s http://127.0.0.1:8080/health
# {"ok":true,"gs":true,"ffmpeg":true}
```

Worker listens on **127.0.0.1:8080** only; nginx will expose it on 443.

---

## 5. DNS (Namecheap)

In Namecheap → **clickcompress.com → Advanced DNS**:

| Type | Host | Value |
|------|------|-------|
| A | `compression` | `YOUR_VM_IP` |

Wait 5–30 minutes for propagation. Test:

```bash
dig +short compression.clickcompress.com
```

---

## 6. nginx + HTTPS

On the VM:

```bash
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

    client_max_body_size 100M;

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

Enable site (cert paths come after certbot):

```bash
sudo ln -sf /etc/nginx/sites-available/compression /etc/nginx/sites-enabled/
sudo nginx -t
```

Get certificate (nginx can be stopped briefly or use standalone):

```bash
sudo certbot --nginx -d compression.clickcompress.com
sudo nginx -t && sudo systemctl reload nginx
```

Test from your laptop:

```bash
curl -s https://compression.clickcompress.com/health
```

---

## 7. Vercel environment variable

In **Vercel → click-compress → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_COMPRESSION_WORKER_URL` | `https://compression.clickcompress.com` |

Redeploy (or push to `main`).

When this is set, **PDF and video** files on production upload directly to the worker instead of Vercel server actions.

---

## 8. Worker environment (optional)

Edit `compression-worker/docker-compose.yml` on the VM:

| Variable | Default | Purpose |
|----------|---------|---------|
| `WORKER_MAX_UPLOAD_MB` | `100` | Max upload size |
| `WORKER_ALLOWED_ORIGINS` | clickcompress.com + localhost | CORS |
| `WORKER_SECRET` | (unset) | Bearer auth — **do not use with browser uploads** (secret would be exposed). Use CORS + rate limiting instead. |

After changes:

```bash
cd ~/click-compress/compression-worker
docker compose up -d --build
```

---

## 9. Updates

```bash
cd ~/click-compress
git pull
cd compression-worker
docker compose up -d --build
```

---

## 10. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `curl` to `/health` fails externally | Check Oracle security list (443), nginx, certbot |
| CORS error in browser | Add your origin to `WORKER_ALLOWED_ORIGINS` |
| 413 on upload | Increase `client_max_body_size` in nginx and `WORKER_MAX_UPLOAD_MB` in compose |
| `gs: false` in health | Rebuild Docker image (Ghostscript missing) |
| Slow video | Normal on 1 OCPU; raise CRF in `compress.mjs` for faster/larger files |
| Worker down after reboot | `docker compose` uses `restart: unless-stopped`; enable Docker on boot: `sudo systemctl enable docker` |

---

## Architecture notes

- **No file data through Vercel** for worker path — only the browser talks to Oracle.
- **My Files** (encrypted storage) still optional; without R2, saves stay ephemeral on Vercel `/tmp`.
- Images and small files continue to compress in the browser on Vercel.
- For a non-Oracle fallback, the same Docker image runs on Railway/Fly.io (paid after free tier).

---

## Quick checklist

- [ ] Oracle ARM VM running Ubuntu
- [ ] Ports 22, 80, 443 open
- [ ] `docker compose up -d --build` → health shows `gs` + `ffmpeg` true
- [ ] A record `compression` → VM IP
- [ ] HTTPS works on `compression.clickcompress.com`
- [ ] Vercel `NEXT_PUBLIC_COMPRESSION_WORKER_URL` set and redeployed
- [ ] Test a 10 MB PDF on clickcompress.com → progress says “compression worker”
