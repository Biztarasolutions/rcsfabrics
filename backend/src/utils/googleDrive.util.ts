import { google } from 'googleapis';
import path from 'path';

// Define the scopes for the Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Initialize the Google Auth client
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../google-credentials.json'),
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

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
