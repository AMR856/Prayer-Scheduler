const { z } = require('zod');

class UserValidationSchema {
  // static register = z.object({
  //   email: z.string().trim().toLowerCase().email('It has to be an email'),
  //   password: z
  //     .string()
  //     .min(6, 'Password must be at least 6 characters')
  //     .regex(/[A-Z]/, 'Must contain an uppercase letter')
  //     .regex(/[0-9]/, 'Must contain a number')
  //     .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  //   username: z.string().optional(),
  // });

  // static login = z.object({
  //   email: z.string().trim().toLowerCase().email('It has to be an email'),
  //   password: z.string(),
  // });

  static createUser = z.object({
    email: z.string().email('Invalid email format.').optional(),
    phone: z.string()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone format. Use international format like +201000000000.')
      .optional()
  }).refine(
    (data) => data.email || data.phone,
    { message: 'At least one of email or phone is required.' }
  );

  static deleteUser = z.object({
    email: z.string().email('Valid email is required.')
  });
}

module.exports = { UserValidationSchema };