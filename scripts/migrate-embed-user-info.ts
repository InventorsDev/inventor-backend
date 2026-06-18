/**
 * One-time migration: collapse the referenced BasicInfo / ProfessionalInfo /
 * ContactInfo collections into embedded sub-documents on each User.
 *
 * Idempotent: users whose `basicInfo` is already an embedded object are skipped.
 *
 * Run:  npx ts-node scripts/migrate-embed-user-info.ts
 */
import { Connection, Types } from 'mongoose';

const isObjectId = (value: unknown): boolean =>
  value instanceof Types.ObjectId ||
  (typeof value === 'string' && Types.ObjectId.isValid(value));

export async function migrateEmbedUserInfo(conn: Connection) {
  console.log('[Migration] Starting migration...');

  const users = conn.collection('users');
  const basics = conn.collection('basicinfos');
  const pros = conn.collection('professionalinfos');
  const contacts = conn.collection('contactinfos');

  const cursor = users.find({});
  let migrated = 0;
  let skipped = 0;

  for await (const user of cursor) {
    // already embedded (object, not an ObjectId ref) -> skip
    if (user.basicInfo && !isObjectId(user.basicInfo)) {
      skipped++;
      continue;
    }

    const [basic, pro, contact] = await Promise.all([
      user.basicInfo
        ? basics.findOne({ _id: new Types.ObjectId(user.basicInfo) })
        : null,
      user.professionalInfo
        ? pros.findOne({ _id: new Types.ObjectId(user.professionalInfo) })
        : null,
      user.contactInfo
        ? contacts.findOne({ _id: new Types.ObjectId(user.contactInfo) })
        : null,
    ]);

    const strip = (doc: Record<string, unknown> | null) => {
      if (!doc) return {};
      const { _id, __v, ...rest } = doc;
      return rest;
    };

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          basicInfo: strip(basic),
          professionalInfo: strip(pro),
          contactInfo: strip(contact),
        },
      },
    );
    migrated++;
    if (migrated % 100 === 0) console.log(`...migrated ${migrated}`);
  }

  console.log(`[Migration] Done. Migrated: ${migrated}, skipped: ${skipped}`);
}
