/**
 * Optional Legacy Database Collections Cleanup Script
 *
 * This script identifies and optionally removes obsolete MongoDB collections
 * and user document fields from the legacy BookVerse social reading platform.
 *
 * SAFETY GUARANTEE:
 * - Runs in DRY-RUN mode by default.
 * - Does NOT drop any collections unless run with the `--execute` argument.
 * - Never modifies core LMS collections (books, bookcopies, loans, reservations, fines, auditlogs, notifications, users).
 *
 * Usage:
 *   Dry run (inspect only):
 *     node src/utils/cleanupLegacyCollections.js
 *
 *   Execute cleanup:
 *     node src/utils/cleanupLegacyCollections.js --execute
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

// List of legacy collections created by the old BookVerse social platform
const LEGACY_COLLECTIONS = [
  'badges',
  'userbadges',
  'challenges',
  'challengeparticipations',
  'clubs',
  'bookclubs',
  'clubposts',
  'discussions',
  'discussionreplies',
  'follows',
  'messages',
  'moderationactions',
  'quotes',
  'readingprogresses',
  'reports',
  'reviews',
  'comments',
  'bookshelves',
  'categories'
];

// Preserved core Library Management System collections
const PRESERVED_LMS_COLLECTIONS = [
  'books',
  'bookcopies',
  'loans',
  'reservations',
  'fines',
  'auditlogs',
  'notifications',
  'users'
];

async function runCleanup() {
  const isExecute = process.argv.includes('--execute');

  console.log('='.repeat(60));
  console.log('Library Management System: Database Audit & Legacy Cleanup');
  console.log(`Mode: ${isExecute ? '⚠️ EXECUTE (DESTRUCTIVE WITH CONFIRMATION)' : '🛡️ DRY RUN (AUDIT ONLY)'}`);
  console.log('='.repeat(60));

  await connectDB();

  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const existingNames = collections.map((c) => c.name.toLowerCase());

    console.log(`\nFound ${existingNames.length} total collections in database:`);
    console.log(existingNames.map((n) => ` - ${n}`).join('\n'));

    // Identify which legacy collections exist
    const foundLegacy = existingNames.filter((name) => LEGACY_COLLECTIONS.includes(name));

    console.log(`\nIdentified ${foundLegacy.length} legacy collection(s) to clean:`);
    if (foundLegacy.length === 0) {
      console.log('  ✅ No legacy collections detected in database.');
    } else {
      for (const colName of foundLegacy) {
        const count = await db.collection(colName).countDocuments();
        console.log(`  - ${colName} (${count} documents)`);
      }
    }

    if (isExecute) {
      if (foundLegacy.length > 0) {
        console.log('\nDropping obsolete legacy collections...');
        for (const colName of foundLegacy) {
          await db.collection(colName).drop();
          console.log(`  🗑️ Dropped collection: ${colName}`);
        }
      }

      console.log('\nSanitizing legacy fields in users collection...');
      const unsetResult = await db.collection('users').updateMany(
        {},
        {
          $unset: {
            readingGoal: '',
            readingStreak: '',
            followersCount: '',
            followingCount: ''
          }
        }
      );
      console.log(`  ✨ Sanitized users collection: ${unsetResult.modifiedCount} user documents updated.`);
      console.log('\n✅ Database cleanup completed successfully!');
    } else {
      console.log('\n[Dry Run Summary]');
      if (foundLegacy.length > 0) {
        console.log(`To drop these ${foundLegacy.length} legacy collection(s) and sanitize user documents, re-run with:`);
        console.log('  node src/utils/cleanupLegacyCollections.js --execute');
      } else {
        console.log('Database is already clean and aligned with the Library Management System.');
      }
    }
  } catch (error) {
    console.error('❌ Error during cleanup script:', error);
  } finally {
    await disconnectDB();
    console.log('\nDatabase connection closed.\n');
  }
}

if (require.main === module) {
  runCleanup();
}

module.exports = runCleanup;
