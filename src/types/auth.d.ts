export interface TokenPayload {
  sub: string; // User ID
  role: string; // User role/tier
  type: "access" | "refresh";
}
