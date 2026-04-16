import { promises as fs } from 'fs'; // Removed readdirSync
import { join } from 'path';
import { __dirname } from '../utils/filesystem.ts';

const STICKERS_DIR = join(__dirname, 'assets', 'stickers', 'cats');

let cachedStickers: string[] | null = null;

const getRandomSticker = async (): Promise<string> => {
    try {
        if (!cachedStickers) {
            const entries = await fs.readdir(STICKERS_DIR, { withFileTypes: true });
            cachedStickers = entries
                .filter(e => e.isFile())
                .map(e => e.name);
                
            if (cachedStickers.length === 0) {
                throw new Error('No stickers found in cats folder');
            }
        }

        const index = Math.floor(Math.random() * cachedStickers.length);
        const chosen = cachedStickers[index];

        if (!chosen) {
            throw new Error(`Sticker at index ${index} is undefined. Cache length: ${cachedStickers.length}`);
        }

        return join(STICKERS_DIR, chosen);

    } catch (error) {
        console.error(error); 

        throw error;
    }
};

export default getRandomSticker;