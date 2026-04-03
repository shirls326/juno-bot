import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure CommonJS variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(dirname(__filename), '..'); // goto parent directory since this is in utils/

async function getExportsFromModule(path: string) {
  return await import(path);
}

export { __dirname, getExportsFromModule };
