// Pre-generate the AI response lines as ElevenLabs audio for /talk/ask-the-floor.
// Usage (PowerShell):   $env:ELEVENLABS_API_KEY="sk_..."; node scripts/gen-tts.mjs
// Writes public/talk/vo/line-0.mp3 … line-4.mp3 (committed; no key in the client).
//
// Keep LINES in sync with SCRIPT[].say in app/talk/ask-the-floor/page.tsx
// (emoji/markup stripped — TTS shouldn't read them aloud).

import { writeFile, mkdir } from 'node:fs/promises';

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('Set ELEVENLABS_API_KEY in your environment first.');
  process.exit(1);
}

const VOICE_NAME = 'Lucas T v1';
const MODEL = 'eleven_turbo_v2_5';
const LINES = [
  '58 low-ticket sales so far, and climbing.',
  '24 booked. All qualified, all on the calendar.',
  'Every one. Fifty of me, around the clock.',
  'Agent zero four, six calls booked.',
  'Always. I never sleep.',
];

// Resolve the voice id by name so you only need the friendly name.
const vres = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': KEY } });
if (!vres.ok) {
  console.error('Could not list voices:', vres.status, await vres.text());
  process.exit(1);
}
const { voices } = await vres.json();
const voice = voices.find((v) => v.name === VOICE_NAME);
if (!voice) {
  console.error(`Voice "${VOICE_NAME}" not found. Available: ${voices.map((v) => v.name).join(', ')}`);
  process.exit(1);
}
console.log(`Using voice "${voice.name}" (${voice.voice_id})`);

await mkdir('public/talk/vo', { recursive: true });

for (let i = 0; i < LINES.length; i++) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: LINES[i],
      model_id: MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
    }),
  });
  if (!r.ok) {
    console.error(`TTS failed for line ${i}:`, r.status, await r.text());
    process.exit(1);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(`public/talk/vo/line-${i}.mp3`, buf);
  console.log(`wrote public/talk/vo/line-${i}.mp3 (${buf.length} bytes)`);
}

console.log('Done. Hard-refresh /talk/ask-the-floor and tap to start.');
