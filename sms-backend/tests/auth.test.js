import request from 'supertest';
import app from '../server.js';

describe('POST /api/auth/login', () => {
  test('returns 400 if username or password missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('returns 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'wrong', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/students', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/courses', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/intakes', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/intakes');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admins', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/admins');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/students', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/students').send({});
    expect(res.status).toBe(401);
  });
});