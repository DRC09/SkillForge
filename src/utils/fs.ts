import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeFileSafe(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function readFileSafe(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function listFilesRecursive(
  rootDir: string,
  shouldInclude?: (relativePath: string, isDirectory: boolean) => boolean
): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');

      if (shouldInclude && !shouldInclude(relPath, entry.isDirectory())) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        results.push(relPath);
      }
    }
  }

  walk(rootDir);
  return results.sort();
}
