import { promises as fs } from 'fs';
import { join } from 'path';
import { __dirname } from '../utils/filesystem.ts';

const STICKERS_DIR = join(__dirname, 'assets', 'stickers', 'cats');

let stickersManifest: Promise<string[]> | null = null;

const fetchStickers = async (): Promise<string[]> => {
  const entries = await fs.readdir(STICKERS_DIR, { withFileTypes: true });
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  const files = entries
    .filter((e) => e.isFile() && validExtensions.some((ext) => e.name.toLowerCase().endsWith(ext)))
    .map((e) => e.name);

  if (files.length === 0) {
    throw new Error('No valid sticker images found');
  }
  return files;
};

const getRandomSticker = async (): Promise<string> => {
  try {
    if (!stickersManifest) {
      stickersManifest = fetchStickers();
    }

    const cachedList = await stickersManifest;
    const index = Math.floor(Math.random() * cachedList.length);
    const chosen = cachedList[index];

    if (!chosen) {
      throw new Error('Failed to select a random sticker');
    }

    return join(STICKERS_DIR, chosen);
  } catch (error) {
    stickersManifest = null;
    console.error(error);
    throw error;
  }
};

export default getRandomSticker;
