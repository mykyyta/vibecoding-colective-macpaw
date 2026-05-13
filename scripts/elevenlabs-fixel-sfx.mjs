#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const API_BASE_URL = "https://api.elevenlabs.io/v1";
const OUTPUT_DIR = "public/audio";
const DEFAULT_MODEL_ID = "eleven_text_to_sound_v2";

const FIXEL_SOUND_EFFECTS = [
  {
    id: "fixel-purr-soft",
    fileName: "fixel-purr-soft.mp3",
    durationSeconds: 1.8,
    prompt:
      "Close-microphone recording of a large fluffy Maine Coon cat purring deeply at rest, slow warm low-frequency rumble, soft breathing, content and relaxed, no meow, no chirp, no human voice, no words, no music, no background noise",
    promptInfluence: 0.85,
  },
  {
    id: "fixel-grumble",
    fileName: "fixel-grumble.mp3",
    durationSeconds: 1.4,
    prompt:
      "Close-microphone recording of a lazy Maine Coon cat grumbling sleepily when disturbed, short low irritated 'mrrr' followed by a slow scoffing exhale, annoyed but not aggressive, no meow, no chirp, no human voice, no words, no music, no background noise",
    promptInfluence: 0.85,
  },
  {
    id: "fixel-wake-mrrp",
    fileName: "fixel-wake-mrrp.mp3",
    durationSeconds: 2.0,
    prompt:
      "Close-microphone recording of a Maine Coon cat lifting its head and chirping a quiet curious 'mrrp' trill when it smells food, soft pleased rumble after, awake and interested, no meow, no human voice, no words, no music, no background noise",
    promptInfluence: 0.85,
  },
];

loadDotEnv();

const args = new Set(process.argv.slice(2));
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const only = onlyArg?.slice("--only=".length);
const force = args.has("--force");

if (args.has("--help")) {
  usage();
  process.exit(0);
}

if (!args.has("--yes")) {
  usage();
  console.error(
    "\nRefusing to call ElevenLabs Sound Effects without --yes because this can consume paid credits.",
  );
  process.exit(1);
}

const apiKey = requireEnv("ELEVENLABS_API_KEY");
const modelId = process.env.ELEVENLABS_SFX_MODEL || DEFAULT_MODEL_ID;
const selected = only
  ? FIXEL_SOUND_EFFECTS.filter((effect) => effect.id === only)
  : FIXEL_SOUND_EFFECTS;

if (selected.length === 0) {
  throw new Error(`Unknown Fixel sound effect id: ${only}`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const effect of selected) {
  const outputPath = join(OUTPUT_DIR, effect.fileName);

  if (existsSync(outputPath) && !force) {
    console.log(`Skipping ${outputPath}; pass --force to regenerate.`);
    continue;
  }

  const audio = await createSoundEffect({
    apiKey,
    modelId,
    text: effect.prompt,
    durationSeconds: effect.durationSeconds,
    promptInfluence: effect.promptInfluence,
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(audio));
  console.log(`Wrote ${outputPath}`);
}

async function createSoundEffect({
  apiKey,
  modelId,
  text,
  durationSeconds,
  promptInfluence,
}) {
  const response = await fetch(`${API_BASE_URL}/sound-generation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      duration_seconds: durationSeconds,
      prompt_influence: promptInfluence,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs sound effect request failed: ${response.status} ${response.statusText}${errorText ? `\n${errorText}` : ""}`,
    );
  }

  return response.arrayBuffer();
}

function loadDotEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function usage() {
  console.log(`Usage:
  npm run elevenlabs:sfx:fixel -- --yes
  npm run elevenlabs:sfx:fixel -- --yes --only=fixel-wake-mrrp
  npm run elevenlabs:sfx:fixel -- --yes --force

Writes:
  public/audio/fixel-purr-soft.mp3
  public/audio/fixel-grumble.mp3
  public/audio/fixel-wake-mrrp.mp3

Required:
  ELEVENLABS_API_KEY

Optional:
  ELEVENLABS_SFX_MODEL=${DEFAULT_MODEL_ID}`);
}
