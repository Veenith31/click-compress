FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ghostscript ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/compression-worker

COPY compression-worker/package.json ./
RUN npm install --omit=dev

COPY compression-worker/ ./

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
