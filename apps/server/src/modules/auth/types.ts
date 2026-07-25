export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  // refreshToken is handled via cookies, but we might return it for tests or fallback
  refreshToken?: string; 
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}
