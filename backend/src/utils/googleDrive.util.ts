import { google } from 'googleapis';
import path from 'path';

// Define the scopes for the Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Initialize the Google Auth client dynamically to support both local files and in-memory cloud credentials
let auth: any;
if (process.env.GOOGLE_CREDS_JSON) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDS_JSON);
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key?.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });
  } catch (err: any) {
    console.error('Error parsing GOOGLE_CREDS_JSON environment variable:', err);
    auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../../google-credentials.json'),
      scopes: SCOPES,
    });
  }
} else {
  auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google-credentials.json'),
    scopes: SCOPES,
  });
}

const drive = google.drive({ version: 'v3', auth });

const driveListParams = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
} as const;

/** Image base name matches product code (e.g. Lachka-Stretchable-Orange-P10002.jpg or ...-1.jpg) */
export const filenameMatchesProductCode = (filename: string, productCode: string): boolean => {
  const base = (filename || '').replace(/\.[^.]+$/, '').trim().toLowerCase();
  const code = productCode.trim().toLowerCase();
  if (!base || !code) return false;
  return base === code || base.startsWith(`${code}-`) || base.startsWith(`${code}_`);
};

const sortImageFiles = (files: DriveFileDetails[]) => {
  files.sort((a, b) => {
    const getNumber = (filename: string | null | undefined): number => {
      if (!filename) return 0;
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const lastHyphenIndex = nameWithoutExt.lastIndexOf('-');
      if (lastHyphenIndex !== -1) {
        const numStr = nameWithoutExt.substring(lastHyphenIndex + 1);
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) return num;
      }
      return 0;
    };
    const numA = getNumber(a.name);
    const numB = getNumber(b.name);
    if (numA !== numB) return numA - numB;
    return (a.name || '').localeCompare(b.name || '');
  });
  return files;
};

/**
 * Extracts the folder ID from a Google Drive folder URL.
 */
export const extractFolderId = (url: string): string | null => {
  if (!url) return null;
  // Match folder ID from urls like https://drive.google.com/drive/folders/1dR7... or https://drive.google.com/open?id=1dR7...
  const folderMatch = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return null;
};

const escapeDriveQueryValue = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export const folderUrlFromId = (folderId: string) =>
  `https://drive.google.com/drive/folders/${folderId}`;

/**
 * Searches for a folder by exact name in Google Drive and returns its ID.
 */
export const findFolderIdByName = async (folderName: string): Promise<string | null> => {
  const trimmed = folderName?.trim();
  if (!trimmed) return null;

  try {
    const escaped = escapeDriveQueryValue(trimmed);
    const res = await drive.files.list({
      ...driveListParams,
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${escaped}' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 10,
    });
    const files = res.data.files || [];
    if (files.length > 0) {
      return files[0].id as string;
    }

    // Fuzzy: contains search then pick case-insensitive exact match
    const fuzzyRes = await drive.files.list({
      ...driveListParams,
      q: `mimeType = 'application/vnd.google-apps.folder' and name contains '${escaped}' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 25,
    });
    const fuzzyFiles = fuzzyRes.data.files || [];
    const normalized = trimmed.toLowerCase();
    const exact = fuzzyFiles.find((f) => f.name?.trim().toLowerCase() === normalized);
    if (exact?.id) return exact.id as string;
    if (fuzzyFiles[0]?.id) return fuzzyFiles[0].id as string;

    return null;
  } catch (error) {
    console.error(`Error finding folder by name ${folderName}:`, error);
    return null;
  }
};

/**
 * Tries multiple folder names and returns the first match.
 */
export const findFolderIdByNames = async (
  folderNames: string[]
): Promise<{ folderId: string; matchedName: string } | null> => {
  const tried = new Set<string>();
  for (const name of folderNames) {
    const key = name?.trim();
    if (!key || tried.has(key)) continue;
    tried.add(key);
    const folderId = await findFolderIdByName(key);
    if (folderId) return { folderId, matchedName: key };
  }
  return null;
};

/**
 * Finds image files anywhere in Drive whose filename matches the product code.
 */
export const findImageFilesByProductCode = async (
  productCode: string
): Promise<DriveFileDetails[]> => {
  const trimmed = productCode?.trim();
  if (!trimmed) return [];

  try {
    const escaped = escapeDriveQueryValue(trimmed);
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const parentClause = rootFolderId ? ` and '${rootFolderId}' in parents` : '';

    const res = await drive.files.list({
      ...driveListParams,
      q: `mimeType contains 'image/' and name contains '${escaped}' and trashed = false${parentClause}`,
      fields: 'files(id, name, mimeType)',
      pageSize: 100,
    });

    const files = (res.data.files || []) as DriveFileDetails[];
    return sortImageFiles(files.filter((f) => filenameMatchesProductCode(f.name, trimmed)));
  } catch (error) {
    console.error(`Error finding images by product code ${productCode}:`, error);
    return [];
  }
};

/**
 * Fetches all image files from a Google Drive folder, sorts them by the number after the last hyphen in the filename,
 * and returns their direct URLs.
 */
export const fetchAndSortFolderImages = async (folderId: string): Promise<string[]> => {
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 1000,
    });

    const files = res.data.files || [];

    // Sort files based on the number after the last hyphen (e.g., fabric-name-1.jpg, fabric-name-2.jpg)
    files.sort((a, b) => {
      const getNumber = (filename: string | null | undefined): number => {
        if (!filename) return 0;
        // Remove extension
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const lastHyphenIndex = nameWithoutExt.lastIndexOf('-');
        if (lastHyphenIndex !== -1) {
          const numStr = nameWithoutExt.substring(lastHyphenIndex + 1);
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) return num;
        }
        return 0; // Default to 0 if no number found
      };

      const numA = getNumber(a.name);
      const numB = getNumber(b.name);

      // If both have numbers, sort numerically. Otherwise fallback to alphabetical sort.
      if (numA !== numB) {
        return numA - numB;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    // Map to direct URLs
    return files.map(file => `https://drive.google.com/uc?export=view&id=${file.id}`);
  } catch (error) {
    console.error('Error fetching Google Drive folder files:', error);
    throw new Error('Failed to fetch files from the provided Google Drive folder. Ensure the folder is shared with the service account.');
  }
};

/**
 * Fetches a file's media stream from Google Drive using the service account.
 */
export const getDriveImageStream = async (fileId: string) => {
  return await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
};

export interface DriveFileDetails {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Fetches all image files from a Google Drive folder with details (id, name, mimeType)
 * and sorts them numerically/alphabetically.
 */
export const fetchFolderImageDetails = async (folderId: string): Promise<DriveFileDetails[]> => {
  try {
    const res = await drive.files.list({
      ...driveListParams,
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 1000,
    });

    return sortImageFiles((res.data.files || []) as DriveFileDetails[]);
  } catch (error) {
    console.error('Error fetching Google Drive folder image details:', error);
    throw new Error('Failed to fetch details from the provided Google Drive folder. Ensure the folder is shared with the service account.');
  }
};

/**
 * Fetches images in a folder that match the product code in the filename.
 */
export const fetchFolderImagesByProductCode = async (
  folderId: string,
  productCode: string
): Promise<DriveFileDetails[]> => {
  const all = await fetchFolderImageDetails(folderId);
  return all.filter((f) => filenameMatchesProductCode(f.name, productCode));
};

