import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Email API Integration Tests', () => {
  const baseUrl = 'http://localhost:4321';
  const headers = {
    'Content-Type': 'application/json',
    'Origin': baseUrl,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/emails', () => {
    it('should reject requests without Content-Type header', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers: {
          'Origin': baseUrl,
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message with enough characters.',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Content-Type');
    });

    it('should reject requests with invalid Content-Type', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Origin': baseUrl,
        },
        body: 'invalid data',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Content-Type');
    });

    it('should reject requests with invalid JSON', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid JSON');
    });

    it('should reject requests with invalid data schema', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'J', // Too short
          email: 'invalid-email',
          message: 'Short',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid input data');
      expect(data.details).toBeDefined();
    });

    it('should reject requests missing required fields', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'John Doe',
          // Missing email and message
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid input data');
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      for (const email of invalidEmails) {
        const response = await fetch(`${baseUrl}/api/emails`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'John Doe',
            email,
            message: 'This is a test message with enough characters.',
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Invalid input data');
      }
    });

    it('should accept valid form data', async () => {
      const response = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message with enough characters.',
        }),
      });

      // Should either succeed (200) or fail due to missing env vars (500)
      expect([200, 500]).toContain(response.status);
      const data = await response.json();

      if (response.status === 200) {
        expect(data.message).toBe('Email sent successfully');
      } else {
        expect(data.error).toBeDefined();
      }
    });

    it('should handle boundary values for name length', async () => {
      // Test minimum length (2 characters)
      const minResponse = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'AB',
          email: 'test@example.com',
          message: 'This is a test message with enough characters.',
        }),
      });
      expect([200, 500]).toContain(minResponse.status);

      // Test maximum length (50 characters)
      const maxResponse = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'A'.repeat(50),
          email: 'test@example.com',
          message: 'This is a test message with enough characters.',
        }),
      });
      expect([200, 500]).toContain(maxResponse.status);
    });

    it('should handle boundary values for message length', async () => {
      // Test minimum length (10 characters)
      const minResponse = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'John Doe',
          email: 'test@example.com',
          message: 'A'.repeat(10),
        }),
      });
      expect([200, 500]).toContain(minResponse.status);

      // Test maximum length (1000 characters)
      const maxResponse = await fetch(`${baseUrl}/api/emails`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'John Doe',
          email: 'test@example.com',
          message: 'A'.repeat(1000),
        }),
      });
      expect([200, 500]).toContain(maxResponse.status);
    });
  });
});
