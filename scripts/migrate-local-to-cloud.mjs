/**
 * One-time migration: .data/users.json + .data/files/ → PostgreSQL + blob storage.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... [S3_* vars] node scripts/migrate-local-to-cloud.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = process.cwd();
const USERS_PATH = path.join(ROOT, ".data", "users.json");
const FILES_ROOT = path.join(ROOT, ".data", "files");
const BLOB_ROOT = path.join(ROOT, ".data", "blobs");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("Set DATABASE_URL before running migration.");
  process.exit(1);
}

const useS3 = Boolean(
  process.env.S3_BUCKET?.trim() &&
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
    process.env.AWS_SECRET_ACCESS_KEY?.trim(),
);

function getS3() {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  return new S3Client({
    region: process.env.S3_REGION?.trim() || "auto",
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
    },
  });
}

async function putBlob(key, data) {
  if (useS3) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET.trim(),
        Key: key,
        Body: data,
        ContentType: "application/octet-stream",
      }),
    );
    return;
  }
  const target = path.join(BLOB_ROOT, key);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}

async function main() {
  const sql = neon(databaseUrl);

  console.log("Creating tables if needed…");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_files (
      id UUID PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      output_name TEXT NOT NULL,
      original_size BIGINT NOT NULL,
      compressed_size BIGINT NOT NULL,
      method TEXT NOT NULL,
      note TEXT,
      mime_type TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  if (fs.existsSync(USERS_PATH)) {
    const store = JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
    let userCount = 0;
    for (const user of store.users ?? []) {
      await sql`
        INSERT INTO users (id, email, name, password_hash, salt, created_at)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.passwordHash}, ${user.salt}, ${user.createdAt})
        ON CONFLICT (email) DO NOTHING
      `;
      userCount++;
    }
    console.log(`Migrated ${userCount} users.`);
  } else {
    console.log("No .data/users.json found — skipping users.");
  }

  if (!fs.existsSync(FILES_ROOT)) {
    console.log("No .data/files/ found — done.");
    return;
  }

  let fileCount = 0;
  for (const userId of fs.readdirSync(FILES_ROOT)) {
    const indexPath = path.join(FILES_ROOT, userId, "index.json");
    if (!fs.existsSync(indexPath)) continue;
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    for (const file of index.files ?? []) {
      const encPath = path.join(FILES_ROOT, userId, `${file.id}.enc`);
      if (!fs.existsSync(encPath)) continue;

      const storageKey = `files/${userId}/${file.id}.enc`;
      const enc = fs.readFileSync(encPath);
      await putBlob(storageKey, enc);

      await sql`
        INSERT INTO user_files (
          id, user_id, original_name, output_name,
          original_size, compressed_size, method, note, mime_type, storage_key, created_at
        )
        VALUES (
          ${file.id}::uuid, ${file.userId}, ${file.originalName}, ${file.outputName},
          ${file.originalSize}, ${file.compressedSize}, ${file.method},
          ${file.note ?? null}, ${file.mimeType}, ${storageKey}, ${file.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      fileCount++;
    }
  }
  console.log(`Migrated ${fileCount} encrypted files.`);
  console.log(
    useS3 ? "Blobs uploaded to S3/R2." : "Blobs copied to .data/blobs/ (set S3_* for cloud).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
