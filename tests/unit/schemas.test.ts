import { describe, it, expect } from 'vitest';
import { formSchema } from '@/lib/schemas';

describe('formSchema validation', () => {
  it('should validate correct form data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is a test message with enough characters.',
    };

    const result = formSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject name that is too short', () => {
    const invalidData = {
      name: 'J',
      email: 'john@example.com',
      message: 'This is a test message with enough characters.',
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject name that is too long', () => {
    const invalidData = {
      name: 'A'.repeat(51),
      email: 'john@example.com',
      message: 'This is a test message with enough characters.',
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'This is a test message with enough characters.',
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject message that is too short', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Short',
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject message that is too long', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'A'.repeat(1001),
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      name: 'John Doe',
    };

    const result = formSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept boundary values for name (2 and 50 characters)', () => {
    const minData = {
      name: 'AB',
      email: 'test@example.com',
      message: 'A'.repeat(10),
    };
    expect(formSchema.safeParse(minData).success).toBe(true);

    const maxData = {
      name: 'A'.repeat(50),
      email: 'test@example.com',
      message: 'A'.repeat(10),
    };
    expect(formSchema.safeParse(maxData).success).toBe(true);
  });

  it('should accept boundary values for message (10 and 1000 characters)', () => {
    const minData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'A'.repeat(10),
    };
    expect(formSchema.safeParse(minData).success).toBe(true);

    const maxData = {
      name: 'John Doe',
      email: 'test@example.com',
      message: 'A'.repeat(1000),
    };
    expect(formSchema.safeParse(maxData).success).toBe(true);
  });
});
