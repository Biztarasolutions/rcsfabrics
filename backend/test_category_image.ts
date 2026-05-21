import { getDriveImageStream } from './src/utils/googleDrive.util';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const fileId = '1G1JHSbaUQWXbOK_JZB2lyCeG6Rdh_RQ_';
  console.log('Testing file ID:', fileId);

  try {
    const streamRes = await getDriveImageStream(fileId);
    console.log('Success! Headers:', streamRes.headers);
  } catch (err: any) {
    console.error('Error fetching file:', err.message || err);
  }
}

test();
