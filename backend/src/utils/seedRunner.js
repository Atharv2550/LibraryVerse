require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User.model');
const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const { initialBooks, initialUsers } = require('./seedData');
const { syncBookCopyCounts } = require('../services/copy.service');

const runSeed = async () => {
  const conn = await connectDB();
  if (!conn) {
    console.error('Cannot seed without database connection.');
    process.exit(1);
  }

  try {
    console.log('🌱 Seeding LibraryVerse LMS initial data...');

    // 1. Seed LMS Users
    for (const userData of initialUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        await User.create(userData);
        console.log(`  + Created ${userData.role} user: ${userData.email}`);
      } else {
        existing.role = userData.role;
        existing.membershipId = existing.membershipId || userData.membershipId;
        existing.membershipStatus = 'active';
        await existing.save();
        console.log(`  * Updated ${userData.role} user: ${userData.email}`);
      }
    }

    // 2. Seed Books and Physical Copies
    for (const bookData of initialBooks) {
      let book = await Book.findOne({ isbn: bookData.isbn });
      if (!book) {
        book = await Book.create(bookData);
        console.log(`  + Seeded Book: "${book.title}"`);
      }

      // Ensure at least 3 physical copies per book
      const existingCopies = await BookCopy.countDocuments({ book: book._id });
      if (existingCopies < 3) {
        const copiesToCreate = 3 - existingCopies;
        for (let i = 0; i < copiesToCreate; i++) {
          const accessionNumber = `ACC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          const barcode = `BC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          await BookCopy.create({
            book: book._id,
            copyNumber: existingCopies + i + 1,
            accessionNumber,
            barcode,
            shelfLocation: book.shelfLocation || 'Main Stack A-1',
            status: 'available',
            condition: 'good',
            price: 25.0
          });
        }
        await syncBookCopyCounts(book._id);
        console.log(`  + Generated 3 physical copies for "${book.title}"`);
      }
    }

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await disconnectDB();
  }
};

runSeed();
