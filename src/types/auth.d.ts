export interface TokenPayload {
  sub: string; // User ID
  role: string; // User role/tier
  tier: "free" | "pro" | "enterprise";
  type: "access" | "refresh";
}
