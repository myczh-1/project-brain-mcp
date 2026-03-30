import * as fs from 'fs';
import * as path from 'path';

function buildAtomicTempPath(filePath: string): string {
  const directory = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const suffix = `${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  return path.join(directory, `.${fileName}.${suffix}.tmp`);
}

export function atomicWriteFile(filePath: string, content: string): void {
  const tempPath = buildAtomicTempPath(filePath);

  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath);
    }
    throw error;
  }
}
