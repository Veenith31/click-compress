import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
import { useObjectStorage } from "@/lib/env";

const LOCAL_BLOB_ROOT = path.join(process.cwd(), ".data", "blobs");

export function blobStorageKey(userId: string, fileId: string): string {
  return `files/${userId}/${fileId}.enc`;
}

function localBlobPath(key: string): string {
  return path.join(LOCAL_BLOB_ROOT, key);
}

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim() || "auto";
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function putBlob(key: string, data: Buffer): Promise<void> {
  if (useObjectStorage()) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
        Body: data,
        ContentType: "application/octet-stream",
      }),
    );
    return;
  }

  const target = localBlobPath(key);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}

export async function getBlob(key: string): Promise<Buffer> {
  if (useObjectStorage()) {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
      }),
    );
    return streamToBuffer(response.Body);
  }

  const target = localBlobPath(key);
  if (!fs.existsSync(target)) {
    throw new Error("Blob not found.");
  }
  return fs.readFileSync(target);
}

export async function deleteBlob(key: string): Promise<void> {
  if (useObjectStorage()) {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
      }),
    );
    return;
  }

  const target = localBlobPath(key);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}
