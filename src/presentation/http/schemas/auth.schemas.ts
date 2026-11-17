import { z } from 'zod';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

const emailSchema = z
  .string()
  .trim()
  .min(3, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .regex(EMAIL_PATTERN, 'Email must be a valid address');

/** Spec 1.1, rule 2: 8+ chars, at least one letter and one digit, max 72. */
const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine((value) => /[A-Za-z]/.test(value), 'Password must contain at least one letter')
  .refine((value) => /\d/.test(value), 'Password must contain at least one digit');

/** strictObject rejects unknown fields, as required by part 0.5 of the spec. */
export const registerBodySchema = z.strictObject({
  email: emailSchema,
  password: strongPasswordSchema,
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
});

export const loginBodySchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(PASSWORD_MAX_LENGTH),
});

export const refreshBodySchema = z.strictObject({
  refreshToken: z.string().min(1, 'Refresh token is required').max(1024),
});

export const logoutBodySchema = refreshBodySchema;

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
