
import { migrate } from './src/infrastructure/database/database';

async function run() {
  console.log('Running migration...');
  await migrate();
  console.log('Migration done.');
}

run();
