import 'dotenv/config';
import mongoose from 'mongoose';
import { seedAdmin } from './seed-admin';
import { migrateEmbedUserInfo } from './migrate-embed-user-info';

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value || true];
  }),
);

async function run() {
  const uri = process.env.APP_DATABASE_URL;
  if (!uri)
    throw new Error('APP_DATABASE_URL is missing from environment variables.');

  // Shared database connection concern managed at the entry level
  const conn = await mongoose.createConnection(uri).asPromise();

  try {
    // Check for composition workflows
    if (flags.action === 'seed-all' || (!flags.action && flags.seed)) {
      await migrateEmbedUserInfo(conn);
      await seedAdmin(conn);
      return;
    }

    // Route explicit singular tasks
    switch (flags.action) {
      case 'migrate':
        await migrateEmbedUserInfo(conn);
        break;

      case 'seed-admin':
        await seedAdmin(conn);
        break;

      default:
        console.log(`
Available commands:
  --action=migrate      Run embedded info migration
  --action=seed-admin   Seed default administrator account
  --action=seed-all     Run migration followed by admin seeding
        `);
        break;
    }
  } finally {
    await conn.close();
  }
}

run().catch((error) => {
  console.error('Task Execution Failed:', error);
  process.exit(1);
});
