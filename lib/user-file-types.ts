export type UserFileRecord = {
  id: string;
  userId: string;
  originalName: string;
  outputName: string;
  originalSize: number;
  compressedSize: number;
  method: string;
  note?: string;
  mimeType: string;
  createdAt: string;
};
