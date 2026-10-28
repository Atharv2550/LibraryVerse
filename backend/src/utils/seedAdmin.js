const User = require('../models/User.model');
const Policy = require('../models/Policy.model');

/**
 * Ensures an initial administrator account and base system policies exist.
 */
const ensureInitialAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('⚡ No admin account found. Creating initial administrator account...');
      await User.create({
        name: 'Chief Librarian Sarah Vance',
        email: 'admin@libraryverse.test',
        password: 'AdminPassword123!',
        role: 'admin',
        accountStatus: 'active',
        membershipStatus: 'active',
        membershipId: 'LIB-ADMIN-001',
        maxBorrowLimit: 10,
        phone: '+1 (555) 019-2834',
        address: 'Central Library Head Office, Suite 400',
        bio: 'Lead System Administrator & Chief Curator of Library Services.'
      });
      console.log('✅ Initial admin account created: admin@libraryverse.test');
    }

    // Ensure default system policies exist
    await Policy.getEffectivePolicy();
  } catch (err) {
    console.error('Warning: ensureInitialAdmin check encountered an error:', err.message);
  }
};

module.exports = { ensureInitialAdmin };
