import { createHttpServer } from '../transports/http/server.js';

export async function main() {
  const host = process.env.PROJECT_BRAIN_HOST || '127.0.0.1';
  const port = Number(process.env.PROJECT_BRAIN_PORT || process.env.PORT || 3210);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid port: ${process.env.PROJECT_BRAIN_PORT || process.env.PORT}`);
  }

  const server = createHttpServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve());
  });

  console.error(`Project Brain HTTP server running at http://${host}:${port}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
