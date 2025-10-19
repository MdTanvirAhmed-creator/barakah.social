import { z } from "zod";

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  rememberMe: z.boolean().optional(),
});

// Base schema for signup step 1
const signupStep1BaseSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

// Signup Step 1: Email and Password
export const signupStep1Schema = signupStep1BaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

// Signup Step 2: Covenant Acceptance
export const signupStep2Schema = z.object({
  acceptMithaq: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must accept the Mithaq to continue",
    }),
  hasScrolled: z.boolean().refine((val) => val === true, {
    message: "Please read the entire Mithaq",
  }),
});

// Signup Step 3: Profile Information
export const signupStep3Schema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .toLowerCase(),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  madhab: z
    .enum(["hanafi", "shafi", "maliki", "hanbali", "jafari", ""])
    .optional(),
});

// Signup Step 4: Interests
export const signupStep4Schema = z.object({
  interests: z
    .array(z.string())
    .min(1, "Please select at least one interest")
    .max(10, "You can select up to 10 interests"),
});

// Complete signup data (using base schemas for merging)
export const completeSignupSchema = signupStep1BaseSchema
  .merge(signupStep2Schema)
  .merge(signupStep3Schema)
  .merge(signupStep4Schema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupStep1Input = z.infer<typeof signupStep1Schema>;
export type SignupStep2Input = z.infer<typeof signupStep2Schema>;
export type SignupStep3Input = z.infer<typeof signupStep3Schema>;
export type SignupStep4Input = z.infer<typeof signupStep4Schema>;
export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;

// Available interests
export const AVAILABLE_INTERESTS = [
  "Quran",
  "Hadith",
  "Tafsir",
  "Fiqh",
  "Aqeedah",
  "Seerah",
  "Islamic History",
  "Arabic Language",
  "Dawah",
  "Islamic Finance",
  "Halal Living",
  "Parenting",
  "Marriage",
  "Spirituality",
  "Community Service",
  "Islamic Art",
  "Islamic Architecture",
  "Comparative Religion",
  "Islamic Ethics",
  "Science & Islam",
] as const;

// Madhab options
export const MADHAB_OPTIONS = [
  { value: "hanafi", label: "Hanafi" },
  { value: "shafi", label: "Shafi'i" },
  { value: "maliki", label: "Maliki" },
  { value: "hanbali", label: "Hanbali" },
  { value: "jafari", label: "Ja'fari" },
] as const;
