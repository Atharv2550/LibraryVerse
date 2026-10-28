require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User.model');
const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');
const Loan = require('../models/Loan.model');
const Reservation = require('../models/Reservation.model');
const Fine = require('../models/Fine.model');
const AuditLog = require('../models/AuditLog.model');
const { connectDB, disconnectDB } = require('../config/db');

describe('Smart Library Management System Test Suite', () => {
  let adminToken, librarianToken, memberToken, member2Token;
  let adminUser, librarianUser, memberUser, member2User;
  let testBook, testCopy, testCopy2;

  before(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_library_management_system_1234567890';
    await connectDB();

    // Clean up test collections
    await Promise.all([
      User.deleteMany({ email: { $regex: /@librarytest\.com$/ } }),
      Book.deleteMany({ title: { $regex: /^Test LMS Book/ } }),
      BookCopy.deleteMany({ accessionNumber: { $regex: /^ACC-TEST/ } }),
      Loan.deleteMany({}),
      Reservation.deleteMany({}),
      Fine.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    const generateToken = require('../utils/generateToken');

    // 1. Create Admin
    adminUser = await User.create({
      name: 'Admin Vance',
      email: 'admin@librarytest.com',
      password: 'AdminPassword123!',
      role: 'admin',
      membershipId: 'LIB-TEST-ADM01',
      membershipStatus: 'active'
    });
    adminToken = generateToken(adminUser._id);

    // 2. Create Librarian
    librarianUser = await User.create({
      name: 'Librarian Hayes',
      email: 'librarian@librarytest.com',
      password: 'LibPassword123!',
      role: 'librarian',
      membershipId: 'LIB-TEST-LIB01',
      membershipStatus: 'active'
    });
    librarianToken = generateToken(librarianUser._id);

    // 3. Create Member 1
    memberUser = await User.create({
      name: 'Student Marcus',
      email: 'member1@librarytest.com',
      password: 'MemberPassword123!',
      role: 'member',
      membershipId: 'LIB-TEST-MEM01',
      membershipStatus: 'active',
      maxBorrowLimit: 5
    });
    memberToken = generateToken(memberUser._id);

    // 4. Create Member 2
    member2User = await User.create({
      name: 'Student Elena',
      email: 'member2@librarytest.com',
      password: 'MemberPassword123!',
      role: 'member',
      membershipId: 'LIB-TEST-MEM02',
      membershipStatus: 'active',
      maxBorrowLimit: 5
    });
    member2Token = generateToken(member2User._id);


    // 5. Create Test Book
    testBook = await Book.create({
      title: 'Test LMS Book on Algorithms',
      author: 'Donald Knuth',
      genre: 'Computer Science',
      category: 'Computer Science',
      description: 'Comprehensive fundamentals of computer algorithms and architecture.',
      pageCount: 650,
      isbn: '9780201896831',
      shelfLocation: 'Stack CS-101',
      publisher: 'Addison-Wesley',
      totalCopies: 0,
      availableCopies: 0
    });

    // 6. Create 2 physical copies
    testCopy = await BookCopy.create({
      book: testBook._id,
      copyNumber: 1,
      accessionNumber: 'ACC-TEST-001',
      barcode: 'BCTEST001',
      shelfLocation: 'Stack CS-101',
      status: 'available',
      condition: 'new',
      price: 49.99
    });

    testCopy2 = await BookCopy.create({
      book: testBook._id,
      copyNumber: 2,
      accessionNumber: 'ACC-TEST-002',
      barcode: 'BCTEST002',
      shelfLocation: 'Stack CS-101',
      status: 'available',
      condition: 'good',
      price: 49.99
    });

    const { syncBookCopyCounts } = require('../services/copy.service');
    await syncBookCopyCounts(testBook._id);
  });

  after(async () => {
    await Promise.all([
      User.deleteMany({ email: { $regex: /@librarytest\.com$/ } }),
      Book.deleteMany({ title: { $regex: /^Test LMS Book/ } }),
      BookCopy.deleteMany({ accessionNumber: { $regex: /^ACC-TEST/ } }),
      Loan.deleteMany({}),
      Reservation.deleteMany({}),
      Fine.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    await disconnectDB();
  });

  it('1. Role Authorization: Enforces role permissions on sensitive LMS endpoints', async () => {
    // Member should be rejected from circulation issue
    const memberIssue = await request(app)
      .post('/api/loans/issue')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        copyIdentifier: testCopy.barcode,
        memberIdentifier: memberUser.email
      });
    assert.strictEqual(memberIssue.status, 403, 'Member must be forbidden from issuing books');

    // Librarian should be allowed to access circulation
    const libLookup = await request(app)
      .get(`/api/copies/lookup/${testCopy.barcode}`)
      .set('Authorization', `Bearer ${librarianToken}`);
    assert.strictEqual(libLookup.status, 200, 'Librarian can lookup copies');
    assert.strictEqual(libLookup.body.data.barcode, 'BCTEST001');

    // Librarian should be rejected from admin audit logs
    const libAudit = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${librarianToken}`);
    assert.strictEqual(libAudit.status, 403, 'Librarian cannot access admin audit logs');

    // Admin can access audit logs
    const adminAudit = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(adminAudit.status, 200, 'Admin can access audit logs');
  });

  it('2. Physical Copies: Synchronizes Book inventory counts accurately', async () => {
    const updatedBook = await Book.findById(testBook._id);
    assert.strictEqual(updatedBook.totalCopies, 2, 'Total copies must match physical count');
    assert.strictEqual(updatedBook.availableCopies, 2, 'Available copies must be 2');
    assert.strictEqual(updatedBook.issuedCopies, 0, 'Issued copies must be 0');
  });

  it('3. Circulation: Successfully issues a physical book copy to member', async () => {
    const issueRes = await request(app)
      .post('/api/loans/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        copyIdentifier: 'BCTEST001',
        memberIdentifier: memberUser.email
      });

    assert.strictEqual(issueRes.status, 201, 'Loan issue should succeed with 201');
    assert.strictEqual(issueRes.body.data.status, 'active');
    assert.strictEqual(issueRes.body.data.copy.barcode, 'BCTEST001');

    // Verify copy status changed to 'issued'
    const copy = await BookCopy.findById(testCopy._id);
    assert.strictEqual(copy.status, 'issued');

    // Verify book inventory updated
    const book = await Book.findById(testBook._id);
    assert.strictEqual(book.availableCopies, 1);
    assert.strictEqual(book.issuedCopies, 1);
  });

  it('4. Circulation: Prevents duplicate issue of an already checked-out copy', async () => {
    const duplicateIssue = await request(app)
      .post('/api/loans/issue')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        copyIdentifier: 'BCTEST001',
        memberIdentifier: member2User.email
      });

    assert.strictEqual(duplicateIssue.status, 409, 'Duplicate issue must be rejected with 409');
  });

  it('5. Circulation: Allows eligible renewal and increments renewal count', async () => {
    const activeLoan = await Loan.findOne({ copy: testCopy._id, status: 'active' });
    assert.ok(activeLoan, 'Active loan should exist');

    const renewRes = await request(app)
      .post(`/api/loans/${activeLoan._id}/renew`)
      .set('Authorization', `Bearer ${memberToken}`);

    assert.strictEqual(renewRes.status, 200, 'Renewal should succeed');
    assert.strictEqual(renewRes.body.data.renewalCount, 1, 'Renewal count should be 1');
  });

  it('6. Reservations: Member can reserve a title and queue is established', async () => {
    const resRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${member2Token}`)
      .send({
        bookId: testBook._id
      });

    assert.strictEqual(resRes.status, 201, 'Reservation created');
    assert.strictEqual(resRes.body.data.status, 'pending');

    // Prevent duplicate active reservation by same member
    const dupRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${member2Token}`)
      .send({
        bookId: testBook._id
      });
    assert.strictEqual(dupRes.status, 409, 'Duplicate reservation must be rejected');
  });

  it('7. Circulation Return: Automatically holds returned copy for pending reservation', async () => {
    const activeLoan = await Loan.findOne({ copy: testCopy._id, status: 'active' });

    const returnRes = await request(app)
      .post('/api/loans/return')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        loanId: activeLoan._id
      });

    assert.strictEqual(returnRes.status, 200, 'Return processed');
    assert.strictEqual(returnRes.body.data.loan.status, 'returned');
    assert.strictEqual(returnRes.body.data.heldForReservation, true, 'Copy should be held for reservation');

    // Verify copy is now 'reserved' for Member 2
    const copy = await BookCopy.findById(testCopy._id);
    assert.strictEqual(copy.status, 'reserved');

    // Verify Member 2 reservation is updated to 'available' with pickup deadline
    const reservation = await Reservation.findOne({ book: testBook._id, member: member2User._id });
    assert.strictEqual(reservation.status, 'available');
    assert.ok(reservation.pickupDeadline);
  });

  it('8. Fines: Accrues overdue fine and allows manual payment recording', async () => {
    // Create an overdue loan for testing fine calculation
    const overdueDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const overdueLoan = await Loan.create({
      book: testBook._id,
      copy: testCopy2._id,
      member: memberUser._id,
      issuedBy: librarianUser._id,
      issueDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      dueDate: overdueDueDate,
      status: 'active'
    });

    testCopy2.status = 'issued';
    testCopy2.currentLoan = overdueLoan._id;
    await testCopy2.save();

    // Process return on overdue loan
    const returnOverdue = await request(app)
      .post('/api/loans/return')
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        loanId: overdueLoan._id
      });

    assert.strictEqual(returnOverdue.status, 200);
    assert.ok(returnOverdue.body.data.fineAssessed, 'Fine must be assessed for overdue return');
    assert.ok(returnOverdue.body.data.fineAssessed.amount >= 5.0, 'Fine should be at least $5 for 5 days');

    const fineId = returnOverdue.body.data.fineAssessed._id;

    // Member views personal fines
    const myFines = await request(app)
      .get('/api/fines/my')
      .set('Authorization', `Bearer ${memberToken}`);
    assert.strictEqual(myFines.status, 200);
    assert.ok(myFines.body.data.outstandingTotal >= 5.0);

    // Librarian records payment
    const payRes = await request(app)
      .post(`/api/fines/${fineId}/pay`)
      .set('Authorization', `Bearer ${librarianToken}`)
      .send({
        paymentMethod: 'cash',
        notes: 'Paid in cash at circulation counter'
      });

    assert.strictEqual(payRes.status, 200);
    assert.strictEqual(payRes.body.data.status, 'paid');
    assert.strictEqual(payRes.body.data.paymentMethod, 'cash');
  });

  it('9. Analytics & CSV Export: Returns compact datasets and downloadable CSV', async () => {
    const analyticsRes = await request(app)
      .get('/api/library-reports/analytics')
      .set('Authorization', `Bearer ${librarianToken}`);

    assert.strictEqual(analyticsRes.status, 200);
    assert.ok(analyticsRes.body.data.kpis.totalTitles > 0);
    assert.ok(analyticsRes.body.data.kpis.totalCopies > 0);

    // Test CSV export
    const csvRes = await request(app)
      .get('/api/library-reports/export?type=loans')
      .set('Authorization', `Bearer ${librarianToken}`);

    assert.strictEqual(csvRes.status, 200);
    assert.strictEqual(csvRes.headers['content-type'], 'text/csv; charset=utf-8');
    assert.ok(csvRes.text.includes('"Loan ID","Book Title"'));
  });

  it('10. Audit Logging: Records circulation and administrative operations', async () => {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    assert.ok(logs.length > 0, 'Audit logs must be created');

    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('LOAN_ISSUE'), 'LOAN_ISSUE audit log must exist');
    assert.ok(actions.includes('LOAN_RETURN'), 'LOAN_RETURN audit log must exist');
    assert.ok(actions.includes('FINE_PAYMENT_COLLECTED'), 'FINE_PAYMENT_COLLECTED audit log must exist');
  });
});
