/**
 * One-time migration: Downloads all Google Drive product images and re-uploads them
 * to Supabase Storage, then updates the database URLs.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrateDriveImagesToSupabase.ts
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import path from 'path';
// ── Auth ──────────────────────────────────────────────────────────────────────

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

let driveAuth: any;
if (process.env.GOOGLE_CREDS_JSON) {
  const creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
  driveAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
} else {
  driveAuth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google-credentials.json'),
    scopes: SCOPES,
  });
}

const drive = google.drive({ version: 'v3', auth: driveAuth });

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://eufihjcpdolquyxucnpf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract Google Drive file ID from any Drive URL format. */
function extractDriveFileId(url: string): string | null {
  if (!url || !url.includes('drive.google.com')) return null;

  // uc?id=... or uc?export=view&id=...
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // file/d/FILE_ID/...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // backend proxy URL: /api/products/image/FILE_ID
  const proxyMatch = url.match(/\/api\/products\/image\/([a-zA-Z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  return null;
}

/** Download a Drive file by ID into a Buffer. */
async function downloadDriveFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  // Get file metadata first
  const meta = await drive.files.get({
    fileId,
    fields: 'name,mimeType',
    supportsAllDrives: true,
  });

  const mimeType = meta.data.mimeType || 'image/jpeg';
  const name = meta.data.name || `${fileId}.jpg`;

  // Stream the file content
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );

  const buffer = Buffer.from(res.data as ArrayBuffer);
  return { buffer, mimeType, name };
}

/** Upload buffer to Supabase and return the public CDN URL. */
async function uploadToSupabase(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `migrated/${Date.now()}-${cleanName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  SUPABASE_SERVICE_ROLE_KEY env var is not set. Aborting.');
    process.exit(1);
  }

  // Find all ProductImage rows that still point to Google Drive
  const driveImages = await prisma.productImage.findMany({
    where: {
      OR: [
        { url: { contains: 'drive.google.com' } },
        { url: { contains: '/api/products/image/' } },
      ],
    },
    select: { id: true, url: true, productId: true },
  });

  if (driveImages.length === 0) {
    console.log('✅  No Google Drive images found — nothing to migrate.');
    return;
  }

  console.log(`\nFound ${driveImages.length} Drive image(s) to migrate.\n`);

  let succeeded = 0;
  let failed = 0;
  const failures: { id: string; url: string; error: string }[] = [];

  for (let i = 0; i < driveImages.length; i++) {
    const img = driveImages[i];
    const prefix = `[${i + 1}/${driveImages.length}]`;

    const fileId = extractDriveFileId(img.url);
    if (!fileId) {
      console.warn(`${prefix} ⚠️  Could not extract file ID from: ${img.url}`);
      failed++;
      failures.push({ id: img.id, url: img.url, error: 'Could not parse file ID' });
      continue;
    }

    try {
      process.stdout.write(`${prefix} Downloading ${fileId} ...`);
      const { buffer, mimeType, name } = await downloadDriveFile(fileId);

      process.stdout.write(` uploading to Supabase ...`);
      const supabaseUrl = await uploadToSupabase(buffer, name, mimeType);

      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: supabaseUrl },
      });

      console.log(` ✅`);
      succeeded++;
    } catch (err: any) {
      console.log(` ❌  ${err.message}`);
      failed++;
      failures.push({ id: img.id, url: img.url, error: err.message });
    }

    // Small delay to avoid hammering Drive API rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n── Migration complete ──────────────────────────`);
  console.log(`  ✅  Succeeded : ${succeeded}`);
  console.log(`  ❌  Failed    : ${failed}`);

  if (failures.length > 0) {
    console.log(`\nFailed records:`);
    failures.forEach((f) => console.log(`  ${f.id}  ${f.url}\n  → ${f.error}`));
  }
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
