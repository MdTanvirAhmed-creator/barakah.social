export const APP_NAME = "Barakah.Social";
export const APP_DESCRIPTION = "A modern social platform for meaningful connections";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://barakah.social";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

