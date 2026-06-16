/**
 * Seed (or refresh) a single ADMIN account for testing.
 *
 * Idempotent: re-running upserts the same email — promotes it to ADMIN,
 * activates it, verifies the email, and resets the password.
 *
 * NOTE: JwtAdminsGuard normalizes `payload.role` into an array and checks
 * `roles.includes(UserRole.ADMIN)`, so role may be 'ADMIN' or ['ADMIN', ...].
 * This script still sets role to ['ADMIN'] for clarity.
 *
 * Run:
 *   npx ts-node scripts/seed-admin.ts
 *   ADMIN_EMAIL=me@x.com ADMIN_PASSWORD='Secret@123' npx ts-node scripts/seed-admin.ts
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const EMAIL = (process.env.ADMIN_EMAIL || 'admin@inventors.test')
  .trim()
  .toLowerCase();
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

async function main() {
  const uri = process.env.APP_DATABASE_URL;
  if (!uri) throw new Error('APP_DATABASE_URL not set');

  const conn = await mongoose.createConnection(uri).asPromise();
  const users = conn.collection('users');

  const password = await bcrypt.hash(PASSWORD, await bcrypt.genSalt());
  const now = new Date();

  const existing = await users.findOne({ email: EMAIL });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: ['ADMIN'], // exact single-element array (guard requirement)
          status: 'ACTIVE',
          emailVerification: true,
          password,
          updatedAt: now,
        },
      },
    );
    console.log(`Updated existing user -> ADMIN: ${EMAIL}`);
  } else {
    const handle = EMAIL.split('@')[0].replace(/[^a-z0-9]/g, '') || 'admin';
    await users.insertOne({
      email: EMAIL,
      password,
      userHandle: handle,
      role: ['ADMIN'],
      status: 'ACTIVE',
      emailVerification: true,
      pendingInvitation: false,
      joinMethod: 'SIGN_UP',
      basicInfo: { firstName: 'Admin', lastName: 'User' },
      professionalInfo: {},
      contactInfo: {},
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created new ADMIN: ${EMAIL}`);
  }

  await conn.close();
  console.log('\n=== Admin credentials ===');
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log('  login:    POST /api/v1/auth/login');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
