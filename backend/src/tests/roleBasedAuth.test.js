require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User.model');
const Policy = require('../models/Policy.model');

describe('Role-Based Access Control and Librarian Approval Workflow Test Suite', () => {
  let adminToken;
  let adminUser;
  let librarianId;
  const timestamp = Date.now();
  const testUserEmail = `member_${timestamp}@test.com`;
  const testLibrarianEmail = `librarian_${timestamp}@test.com`;
  const testRejectedLibrarianEmail = `rejected_${timestamp}@test.com`;

  before(async () => {
    await connectDB();

    // Ensure test admin exists
    adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin',
        email: `admin_${timestamp}@test.com`,
        password: 'AdminPassword123!',
        role: 'admin',
        accountStatus: 'active'
      });
    }

    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminUser.email,
        password: 'AdminPassword123!'
      });

    if (adminLoginRes.body.data?.token) {
      adminToken = adminLoginRes.body.data.token;
    } else {
      // Direct token generation if password was changed
      const generateToken = require('../utils/generateToken');
      adminToken = generateToken(adminUser._id);
    }
  });

  after(async () => {
    await User.deleteMany({
      email: { $in: [testUserEmail, testLibrarianEmail, testRejectedLibrarianEmail] }
    });
    await disconnectDB();
  });

  test('1. User Registration: Creates role "user" with active status and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Reader',
        email: testUserEmail,
        password: 'UserPass123!',
        confirmPassword: 'UserPass123!',
        role: 'user'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token, 'Should return authentication token');
    assert.strictEqual(res.body.data.role, 'user');
    assert.strictEqual(res.body.data.accountStatus, 'active');
  });

  test('2. Security: Prevents public self-registration with role "admin"', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker Admin',
        email: `hack_${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'admin'
      });

    assert.ok([400, 403].includes(res.status), 'Admin registration must be rejected with 400 or 403');
    assert.strictEqual(res.body.success, false);
  });

  test('3. Security: Rejects registration when password and confirmPassword do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mismatch User',
        email: `mismatch_${timestamp}@test.com`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        role: 'user'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('4. Librarian Registration: Creates role "librarian" with status "pending" and no token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Librarian Candidate',
        email: testLibrarianEmail,
        password: 'LibPassword123!',
        confirmPassword: 'LibPassword123!',
        role: 'librarian'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.pendingApproval, true);
    assert.strictEqual(res.body.data.role, 'librarian');
    assert.strictEqual(res.body.data.accountStatus, 'pending');
    assert.strictEqual(res.body.data.token, undefined, 'Must not return token for pending account');

    librarianId = res.body.data._id;
  });

  test('5. Pending Librarian Login: Blocks login with pending approval message (403)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testLibrarianEmail,
        password: 'LibPassword123!'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /awaiting administrator approval/i);
  });

  test('6. Security: Non-admin users cannot access admin endpoints', async () => {
    // Login as normal user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'UserPass123!'
      });

    const userToken = userLogin.body.data.token;

    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 403);
  });

  test('7. Admin Overview: Admin can view platform metrics', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.totalUsers === 'number');
    assert.ok(typeof res.body.data.totalBooks === 'number');
    assert.ok(typeof res.body.data.pendingLibrarians === 'number');
  });

  test('8. Admin Approval: Admin approves pending librarian application', async () => {
    const res = await request(app)
      .put(`/api/admin/librarians/${librarianId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.accountStatus, 'approved');
  });

  test('9. Approved Librarian Login: Successfully logs in and receives token with librarian role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testLibrarianEmail,
        password: 'LibPassword123!'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.role, 'librarian');
    assert.strictEqual(res.body.data.accountStatus, 'approved');
  });

  test('10. Admin Rejection: Admin can reject a librarian candidate with a reason', async () => {
    // First register candidate
    const candidateRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rejected Candidate',
        email: testRejectedLibrarianEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'librarian'
      });

    const candidateId = candidateRes.body.data._id;

    // Reject application
    const rejectRes = await request(app)
      .put(`/api/admin/librarians/${candidateId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Background credentials could not be verified' });

    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.data.accountStatus, 'rejected');

    // Candidate login attempt must now fail
    const loginAttempt = await request(app)
      .post('/api/auth/login')
      .send({
        email: testRejectedLibrarianEmail,
        password: 'Password123!'
      });

    assert.strictEqual(loginAttempt.status, 403);
    assert.match(loginAttempt.body.message, /rejected/i);
  });

  test('11. System Policies: Admin can view and update library policies', async () => {
    const getRes = await request(app)
      .get('/api/admin/policies')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(getRes.status, 200);
    assert.ok(getRes.body.data.loanDurationDays);

    const updateRes = await request(app)
      .put('/api/admin/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        loanDurationDays: 21,
        maxBorrowLimit: 7,
        dailyFineRate: 1.50
      });

    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.loanDurationDays, 21);
    assert.strictEqual(updateRes.body.data.maxBorrowLimit, 7);
    assert.strictEqual(updateRes.body.data.dailyFineRate, 1.5);
  });
});
