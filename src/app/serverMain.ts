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

  const shutdown = (signal: NodeJS.Signals) => {
    console.error(`Received ${signal}, shutting down Project Brain HTTP server...`);
    server.close(error => {
      if (error) {
        console.error('Shutdown error:', error);
        process.exit(1);
        return;
      }
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  console.error(`Project Brain HTTP server running at http://${host}:${port}`);
}
