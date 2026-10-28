const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User.model');
const Book = require('../models/Book.model');
const BookCopy = require('../models/BookCopy.model');

describe('LibraryVerse LMS Core API Test Suite', () => {
  let authToken = '';
  let testUserId = '';
  let createdBookId = '';
  const testEmail = `test_${Date.now()}@libraryverse.test`;

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_for_automated_testing_1234567890';
    await connectDB();
  });

  after(async () => {
    // Clean up test records
    if (testUserId) {
      await User.findByIdAndDelete(testUserId);
    }
    if (createdBookId) {
      await BookCopy.deleteMany({ book: createdBookId });
      await Book.findByIdAndDelete(createdBookId);
    }
    await disconnectDB();
  });

  test('GET /api/health should return healthy status and database metrics', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.database.connected, true);
  });

  test('POST /api/auth/register should create a library member with membership ID', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Member',
        email: testEmail,
        password: 'Password123!',
        phone: '+1 555-0199',
        address: '42 Library Lane'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.email, testEmail);
    assert.ok(res.body.data.membershipId, 'Member should be assigned a membershipId');
    assert.strictEqual(res.body.data.password, undefined); // Password never leaked

    authToken = res.body.data.token;
    testUserId = res.body.data._id;
  });

  test('POST /api/auth/login should authenticate user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/auth/me should return current user profile and role', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.email, testEmail);
    assert.ok(res.body.data.role);
  });

  test('GET /api/books should retrieve library catalogue with pagination', async () => {
    const res = await request(app).get('/api/books?limit=5');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.books));
    assert.ok(res.body.data.pagination);
    assert.ok(res.body.data.books.length > 0);
  });

  test('GET /api/books/featured should return featured catalogue books', async () => {
    const res = await request(app).get('/api/books/featured');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  test('POST /api/books should create book and auto-generate physical copies', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Algorithms in Modern Systems',
        author: 'Donald E. Knuth',
        genre: 'Computer Science',
        category: 'Computer Science',
        description: 'Comprehensive analysis of algorithmic efficiency and data structures.',
        pageCount: 520,
        publishedYear: 2024,
        shelfLocation: 'CS Shelf C-2',
        initialCopies: 2
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.title, 'Algorithms in Modern Systems');
    assert.strictEqual(res.body.data.totalCopies, 2);
    assert.strictEqual(res.body.data.availableCopies, 2);
    createdBookId = res.body.data._id;

    // Verify physical copies exist in BookCopy collection
    const copies = await BookCopy.find({ book: createdBookId });
    assert.strictEqual(copies.length, 2);
    assert.ok(copies[0].barcode);
    assert.ok(copies[0].accessionNumber);
  });

  test('GET /api/books/:id should retrieve book detail with inventory counts', async () => {
    const res = await request(app).get(`/api/books/${createdBookId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.title, 'Algorithms in Modern Systems');
    assert.strictEqual(res.body.data.totalCopies, 2);
  });

  test('PUT /api/users/profile should update cardholder contact details', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phone: '+1 555-9876',
        address: '99 Campus Boulevard'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.phone, '+1 555-9876');
    assert.strictEqual(res.body.data.address, '99 Campus Boulevard');
  });

  test('GET /api/users/profile should return member profile with circulation stats', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.user);
    assert.ok(res.body.data.stats);
    assert.strictEqual(typeof res.body.data.stats.activeLoans, 'number');
    assert.strictEqual(typeof res.body.data.stats.activeReservations, 'number');
  });
});
