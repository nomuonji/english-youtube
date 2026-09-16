import fs from 'node:fs';

const [videoPath, manifestPath] = process.argv.slice(2);

if (!videoPath || !manifestPath) {
  console.error('usage: node scripts/upload_youtube.mjs <video.mp4> <manifest.json>');
  process.exit(2);
}

for (const name of ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN']) {
  if (!process.env[name]) {
    throw new Error(`Missing required secret: ${name}`);
  }
}

if (!fs.existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);
if (!fs.existsSync(manifestPath)) throw new Error(`Manifest not found: ${manifestPath}`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const episodeId = String(manifest.episodeId ?? '').trim();
if (!/^[A-Za-z0-9._-]+$/.test(episodeId)) throw new Error('Invalid episodeId in manifest');

const metadataPath = `episodes/${episodeId}/youtube.json`;
const explicitMetadata = fs.existsSync(metadataPath)
  ? JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  : {};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const fallbackTitle = clean(manifest.centralQuestion || manifest.utterances?.[0]?.text || episodeId);
const title = clean(explicitMetadata.title || fallbackTitle).slice(0, 100);
if (!title) throw new Error('YouTube title is empty');

const sourceLines = Array.isArray(manifest.sources)
  ? manifest.sources.slice(0, 8).map((source) => {
      const publisher = clean(source.publisher);
      const sourceTitle = clean(source.title);
      const url = clean(source.url);
      return `- ${publisher}${publisher && sourceTitle ? ': ' : ''}${sourceTitle}${url ? `\n  ${url}` : ''}`;
    })
  : [];

const fallbackDescription = [
  'Learn English through a current, source-backed story.',
  '',
  clean(manifest.answer),
  '',
  sourceLines.length ? 'Sources:' : '',
  ...sourceLines,
  '',
  '#EnglishLearning #EnglishListening #NewsEnglish',
].filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== '')).join('\n').trim();

const description = String(explicitMetadata.description || fallbackDescription).trim().slice(0, 5000);
if (!description) throw new Error('YouTube description is empty');

const defaultTags = [
  'English learning',
  'English listening',
  'news English',
  clean(manifest.category),
].filter(Boolean);
const tags = Array.isArray(explicitMetadata.tags) && explicitMetadata.tags.length
  ? explicitMetadata.tags.map(clean).filter(Boolean)
  : defaultTags;

const privacyStatus = ['public', 'private', 'unlisted'].includes(explicitMetadata.privacyStatus)
  ? explicitMetadata.privacyStatus
  : 'public';
const categoryId = /^\d+$/.test(String(explicitMetadata.categoryId ?? ''))
  ? String(explicitMetadata.categoryId)
  : '28';

const tokenBody = new URLSearchParams({
  client_id: process.env.YOUTUBE_CLIENT_ID,
  client_secret: process.env.YOUTUBE_CLIENT_SECRET,
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  grant_type: 'refresh_token',
});

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: tokenBody,
});
if (!tokenResponse.ok) {
  throw new Error(`OAuth token refresh failed (${tokenResponse.status}): ${await tokenResponse.text()}`);
}
const tokenPayload = await tokenResponse.json();
if (!tokenPayload.access_token) throw new Error('OAuth token refresh returned no access_token');

const bytes = fs.statSync(videoPath).size;
if (bytes < 1_000_000) throw new Error(`Video file is unexpectedly small: ${bytes} bytes`);

const sessionResponse = await fetch(
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
  {
    method: 'POST',
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
      'content-type': 'application/json; charset=UTF-8',
      'x-upload-content-length': String(bytes),
      'x-upload-content-type': 'video/mp4',
    },
    body: JSON.stringify({
      snippet: { title, description, tags, categoryId },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    }),
  },
);

if (!sessionResponse.ok) {
  throw new Error(`YouTube resumable session failed (${sessionResponse.status}): ${await sessionResponse.text()}`);
}

const uploadUrl = sessionResponse.headers.get('location');
if (!uploadUrl) throw new Error('YouTube resumable session returned no upload URL');

console.log(`Uploading ${bytes} bytes to YouTube as ${privacyStatus}...`);
const uploadResponse = await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'content-length': String(bytes),
    'content-type': 'video/mp4',
  },
  body: fs.createReadStream(videoPath),
  duplex: 'half',
});

const uploadText = await uploadResponse.text();
if (!uploadResponse.ok) {
  throw new Error(`YouTube video upload failed (${uploadResponse.status}): ${uploadText}`);
}

const uploaded = JSON.parse(uploadText);
if (!uploaded.id) throw new Error('YouTube upload completed without a video ID');

const result = {
  episodeId,
  youtubeVideoId: uploaded.id,
  youtubeUrl: `https://www.youtube.com/watch?v=${uploaded.id}`,
  title,
  privacyStatus,
  publishedAt: new Date().toISOString(),
  sourceSha: process.env.GITHUB_SHA ?? null,
};

fs.writeFileSync('youtube-publish-result.json', `${JSON.stringify(result, null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `video_id=${uploaded.id}\nvideo_url=${result.youtubeUrl}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## YouTube publish\n\n- Video: ${result.youtubeUrl}\n- Privacy: ${privacyStatus}\n- Episode: ${episodeId}\n`,
  );
}

console.log(JSON.stringify(result));
