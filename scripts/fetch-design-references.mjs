import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

if (FIGMA_TOKEN === undefined) {
  throw new Error(
    'FIGMA_TOKEN environment variable is required. Generate one at figma.com/developers/api#access-tokens.',
  );
}

const FILE_KEY = process.env.FIGMA_FILE_KEY ?? 'vkFq0r8iaGVvluJUA3Rm0D';
const OUTPUT_DIR = fileURLToPath(new URL('../design-refs', import.meta.url));

const REFERENCES = [
  { name: 'home-desktop-1920', nodeId: '1:13' },
  { name: 'home-tablet-768', nodeId: '2:115' },
  { name: 'home-mobile-375', nodeId: '2:367' },
  { name: 'menu-mobile', nodeId: '2:565' },
  { name: 'dialog-login', nodeId: '2:1327' },
  { name: 'dialog-register', nodeId: '2:1363' },
];

async function requestImageUrls() {
  const ids = REFERENCES.map((reference) => reference.nodeId).join(',');
  const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${ids}&format=png&scale=1`;
  const response = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });

  if (!response.ok) {
    throw new Error(`Figma images request failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json();

  if (body.err) {
    throw new Error(`Figma images request failed: ${body.err}`);
  }

  return body.images;
}

async function downloadReference(name, imageUrl) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download ${name}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(new URL(`${name}.png`, `${OUTPUT_DIR}/`), buffer);
  console.log(`Saved design-refs/${name}.png`);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const imagesByNodeId = await requestImageUrls();

  for (const reference of REFERENCES) {
    const imageUrl = imagesByNodeId[reference.nodeId];

    if (imageUrl === null || imageUrl === undefined) {
      console.warn(`No image returned for ${reference.name} (${reference.nodeId})`);
      continue;
    }

    await downloadReference(reference.name, imageUrl);
  }
}

await main();
