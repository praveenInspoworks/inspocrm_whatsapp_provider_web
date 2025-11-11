import { z } from "zod";

// Tenant Signup Schema - Simplified with organizational email validation
export const tenantSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .regex(/^[a-zA-Z0-9._%+-]+@(?!gmail\.com$)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Gmail addresses are not allowed. Please use your organizational email."),
  phone: z.string()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[+]?[0-9\s\-()]+$/, "Invalid phone number format")
    .optional(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]),
  industry: z.string().optional(),
  address: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
});

// Email Verification Schema
export const emailVerificationSchema = z.object({
  token: z.string().min(6, "Verification code must be 6 digits"),
});

// Set Password Schema
export const setPasswordSchema = z.object({
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin Set Password Schema
export const adminSetPasswordSchema = z.object({
  userId: z.number(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  sendEmail: z.boolean().default(true),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Brand Voice Setup Schema
export const brandVoiceSchema = z.object({
  tone: z.enum(["professional", "friendly", "formal", "casual", "luxury", "playful"]),
  voiceProfile: z.string().min(50, "Brand voice profile must be at least 50 characters"),
  bannedWords: z.string().optional(),
  preferredHashtags: z.string().optional(),
  targetAudience: z.string().min(20, "Target audience description must be at least 20 characters"),
  brandValues: z.array(z.string()).min(1, "Please select at least one brand value"),
});

// Campaign Setup Schema
export const campaignSetupSchema = z.object({
  campaignName: z.string().min(3, "Campaign name must be at least 3 characters"),
  campaignType: z.enum(["email", "social", "sms", "multichannel"]),
  targetAudience: z.string().min(20, "Target audience must be at least 20 characters"),
  goals: z.array(z.string()).min(1, "Please select at least one campaign goal"),
  budget: z.number().min(0, "Budget must be a positive number").optional(),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  tenantCode: z.string().optional(),
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string().min(6, "Reset token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports for use in components
export type TenantSignupFormData = z.infer<typeof tenantSignupSchema>;
export type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
export type AdminSetPasswordFormData = z.infer<typeof adminSetPasswordSchema>;
export type BrandVoiceFormData = z.infer<typeof brandVoiceSchema>;
export type CampaignSetupFormData = z.infer<typeof campaignSetupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Industry options
export const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Consulting",
  "Marketing",
  "Non-profit",
  "Other"
] as const;

// Company size options
export const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" }
] as const;

// Brand values options
export const brandValuesOptions = [
  "Innovation",
  "Quality",
  "Customer Satisfaction",
  "Sustainability",
  "Trust",
  "Excellence",
  "Reliability",
  "Creativity",
  "Integrity",
  "Growth"
] as const;

// Campaign goals options
export const campaignGoalsOptions = [
  "Lead Generation",
  "Brand Awareness",
  "Customer Engagement",
  "Sales Conversion",
  "Customer Retention",
  "Product Launch",
  "Event Promotion",
  "Content Distribution"
] as const;
