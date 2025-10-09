export interface JwtPayload {
  sub: string; // User ID
  email: string;
  userType: 'customer' | 'vendor';
  role: 'customer' | 'vendor' | 'admin';
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
