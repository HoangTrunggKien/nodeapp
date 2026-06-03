const request = require('supertest');
const app = require('../src/app');

describe('App Routes', () => {
  test('GET / should return JSON with message and timestamp', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    if (response.body.hostname) {
      expect(response.body).toHaveProperty('hostname');
    }
  });

  test('GET /health should return OK', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });
});
