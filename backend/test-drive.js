const { google } = require('googleapis');
const path = require('path');

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    q: "trashed = false",
    fields: 'files(id, name, mimeType)',
    pageSize: 10,
  });

  console.log('Results (first 10 files):');
  console.log(JSON.stringify(res.data.files, null, 2));
}

main().catch(console.error);
