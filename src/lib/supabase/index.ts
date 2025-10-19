// Main entry point for Supabase utilities

// Clients
export { createClient } from "./client";
export { createServerSupabaseClient } from "./server";

// Auth utilities
export {
  getSession,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  signOut,
  resetPassword,
  updatePassword,
  type AuthError,
  type AuthResult,
} from "./auth";

// Route protection
export {
  requireAuth,
  requireGuest,
  getUser,
  getSession as getServerSession,
} from "./route-protection";

// Database queries
export * from "./queries";

// Storage utilities
export {
  uploadFile,
  deleteFile,
  uploadAvatar,
  uploadPostImage,
  getPublicUrl,
  type UploadResult,
} from "./storage";

