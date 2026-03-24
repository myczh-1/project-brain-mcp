import { main } from './app/mcpMain.js';

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
