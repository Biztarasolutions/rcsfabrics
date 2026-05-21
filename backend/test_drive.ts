import { extractFolderId, fetchFolderImageDetails } from './src/utils/googleDrive.util';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const folderUrl = 'https://drive.google.com/drive/folders/1a5pUZtUtFy9xFMZnY4TdFwKuX4jRJhal?usp=drive_link';
  const folderId = extractFolderId(folderUrl);
  console.log('Extracted folder ID:', folderId);
  if (!folderId) return;

  try {
    const files = await fetchFolderImageDetails(folderId);
    console.log('Found files:', files.length);
    files.forEach(f => console.log(`  - Name: ${f.name}, ID: ${f.id}`));
  } catch (err: any) {
    console.error('Error fetching folder:', err.message || err);
  }
}

test();
