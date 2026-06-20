/** True when PostgreSQL is configured (production user + file metadata store). */
export function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** True when S3-compatible object storage is configured (production file blobs). */
export function useObjectStorage(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

export function fileEncryptionSecret(): string {
  return (
    process.env.FILE_ENCRYPTION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "click-compress-dev-secret-change-in-production"
  );
}

export function authSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    "click-compress-dev-secret-change-in-production"
  );
}

export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
