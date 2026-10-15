import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

const DEBOUNCE_MS = 250;
const IGNORED_SEGMENTS = new Set(['.git', 'node_modules']);
const IGNORED_FILE_NAMES = new Set(['skillforge-report.json']);

function shouldIgnoreChange(relativePath: string): boolean {
  const segments = relativePath.split(/[\\/]/).filter((segment) => segment.length > 0);
  const baseName = segments[segments.length - 1] ?? '';
  return (
    segments.some((segment) => IGNORED_SEGMENTS.has(segment)) || IGNORED_FILE_NAMES.has(baseName)
  );
}

/**
 * Watches a skill directory recursively and reports changes with a 250ms debounce.
 * Returns a function that stops the watcher and cancels any pending notification.
 */
export function watchSkillDirectory(
  skillPath: string,
  onChange: (changedFile: string) => void
): () => void {
  const resolvedDir = path.resolve(skillPath);
  let pendingTimer: NodeJS.Timeout | undefined;
  let lastChangedFile = '';
  let closed = false;

  const watcher = fs.watch(resolvedDir, { recursive: true }, (_eventType, filename) => {
    const changedFile = filename ? filename.toString().replace(/\\/g, '/') : '';
    if (changedFile && shouldIgnoreChange(changedFile)) {
      return;
    }

    lastChangedFile = changedFile;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
    }
    pendingTimer = setTimeout(() => {
      pendingTimer = undefined;
      if (!closed) {
        onChange(lastChangedFile);
      }
    }, DEBOUNCE_MS);
  });

  const stop = (): void => {
    if (closed) {
      return;
    }
    closed = true;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = undefined;
    }
    watcher.close();
  };

  watcher.on('error', (error) => {
    logger.error(`El observador de archivos falló: ${error.message}`);
    stop();
  });

  return stop;
}

/**
 * Runs `action` once, then re-runs it whenever the skill directory changes.
 * Returns the stop function, or null when the directory cannot be watched.
 */
export function startWatchMode(
  skillPath: string,
  action: () => number,
  onResult: (exitCode: number) => void
): (() => void) | null {
  onResult(action());
  logger.info('Observando cambios en el skill (presiona Ctrl+C para salir)...');

  try {
    return watchSkillDirectory(skillPath, (changedFile) => {
      logger.step(`Cambio detectado${changedFile ? `: ${changedFile}` : ''}`);
      try {
        onResult(action());
      } catch (error) {
        logger.error(error instanceof Error ? error.message : 'Error inesperado al re-ejecutar.');
        onResult(1);
      }
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'error desconocido';
    logger.error(`No se pudo observar el directorio ${path.resolve(skillPath)}: ${reason}`);
    onResult(1);
    return null;
  }
}
