import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DESIGN_REFS_DIR = `${ROOT}design-refs`;
const DIFF_DIR = `${ROOT}diff`;
const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173/minigames/';
const MISMATCH_THRESHOLD = 0.2;

const TARGETS = [
  { width: 1920, height: 2760, reference: 'home-desktop-1920.png' },
  { width: 768, height: 2241, reference: 'home-tablet-768.png' },
  { width: 375, height: 2061, reference: 'home-mobile-375.png' },
];

function parseSectionArgument(argv) {
  const equalsArgument = argv.find((argument) => argument.startsWith('--section='));

  if (equalsArgument !== undefined) {
    return equalsArgument.slice('--section='.length);
  }

  const flagIndex = argv.indexOf('--section');
  return flagIndex === -1 ? undefined : argv[flagIndex + 1];
}

function slugify(value) {
  return value.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function croppedChannel(png, width, height) {
  const cropped = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * png.width * 4;
    const destinationStart = y * width * 4;
    cropped.set(png.data.subarray(sourceStart, sourceStart + width * 4), destinationStart);
  }

  return cropped;
}

async function compareBuffers(diffName, actualBuffer, referenceBuffer) {
  const actual = PNG.sync.read(actualBuffer);
  const reference = PNG.sync.read(referenceBuffer);

  const width = Math.min(actual.width, reference.width);
  const height = Math.min(actual.height, reference.height);
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(
    croppedChannel(actual, width, height),
    croppedChannel(reference, width, height),
    diff.data,
    width,
    height,
    { threshold: MISMATCH_THRESHOLD },
  );

  await mkdir(DIFF_DIR, { recursive: true });
  await writeFile(`${DIFF_DIR}/${diffName}`, PNG.sync.write(diff));

  const percent = ((mismatchedPixels / (width * height)) * 100).toFixed(2);
  console.log(`${diffName}: ${percent}% mismatched pixels -> diff/${diffName}`);
}

async function diffFullPage(page, target) {
  const actualBuffer = await page.screenshot({ fullPage: true });
  const referenceBuffer = await readFile(`${DESIGN_REFS_DIR}/${target.reference}`);
  await compareBuffers(target.reference, actualBuffer, referenceBuffer);
}

async function diffSection(page, target, section) {
  const diffName = `${target.width}-${slugify(section)}.png`;
  const referencePath = `${DESIGN_REFS_DIR}/sections/${diffName}`;

  let referenceBuffer;

  try {
    referenceBuffer = await readFile(referencePath);
  } catch {
    console.warn(
      `No section reference at design-refs/sections/${diffName} — export it from Figma first, skipping.`,
    );
    return;
  }

  const actualBuffer = await page.locator(section).screenshot();
  await compareBuffers(diffName, actualBuffer, referenceBuffer);
}

async function main() {
  const section = parseSectionArgument(process.argv.slice(2));
  const browser = await chromium.launch();

  try {
    for (const target of TARGETS) {
      const page = await browser.newPage({
        viewport: { width: target.width, height: target.height },
        deviceScaleFactor: 1,
      });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      if (section === undefined) {
        await diffFullPage(page, target);
      } else {
        await diffSection(page, target, section);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }
}

await main();
