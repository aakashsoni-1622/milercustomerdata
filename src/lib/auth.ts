import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  OPERATIONS = "OPERATIONS",
  CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
  VIEWER = "VIEWER",
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);
const JWT_EXPIRY = "7d"; // 7 days
const SESSION_COOKIE_NAME = "auth-session";

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT utilities
export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Session management (server-side functions moved to auth-server.ts)

// Get current user from request (supports both cookies and headers)
export async function getCurrentUser(
  request: NextRequest
): Promise<User | null> {
  try {
    // Try to get token from multiple sources
    let token: string | null = null;

    // 1. First try Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    // 2. If no Bearer token, try custom X-Auth-Token header
    if (!token) {
      token = request.headers.get("x-auth-token");
    }

    // 3. If no header token, try cookie (for web app)
    if (!token) {
      token = request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
    }

    // 4. If still no token found, return null
    if (!token) {
      return null;
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return null;
    }

    // Return basic user info from JWT payload for middleware
    return {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
      firstName: "", // Would be fetched from DB
      lastName: "", // Would be fetched from DB
      role: payload.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Role-based authorization
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.VIEWER]: 1,
    [UserRole.CUSTOMER_SUPPORT]: 2,
    [UserRole.OPERATIONS]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.SUPER_ADMIN]: 5,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function checkPermissions(
  userRole: UserRole,
  requiredRoles: UserRole[]
): boolean {
  return requiredRoles.some((role) => hasPermission(userRole, role));
}

// Route protection utilities
export const PUBLIC_ROUTES = [
  "/login",
  "/api/auth/login",
  "/api/health/db",
  "/api/orders/bulk-insert",
  "/api/orders/create-v2",
];
export const PROTECTED_ROUTES = [
  "/",
  "/orders",
  "/customers",
  "/products",
  "/add-order",
  "/add-order-v2",
  "/add-bulk-orders",
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

// Route permissions by role
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/": [
    UserRole.VIEWER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/orders": [
    UserRole.VIEWER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/customers": [
    UserRole.CUSTOMER_SUPPORT,
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/products": [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  "/add-order": [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  "/add-order-v2": [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  "/add-bulk-orders": [
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/api/orders": [
    UserRole.VIEWER,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/api/customers": [
    UserRole.CUSTOMER_SUPPORT,
    UserRole.OPERATIONS,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ],
  "/api/products": [UserRole.OPERATIONS, UserRole.ADMIN, UserRole.SUPER_ADMIN],
};

export function hasRoutePermission(
  pathname: string,
  userRole: UserRole
): boolean {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname].includes(userRole);
  }

  // Check for partial matches (for dynamic routes)
  for (const route in ROUTE_PERMISSIONS) {
    if (pathname.startsWith(route) && route !== "/") {
      return ROUTE_PERMISSIONS[route].includes(userRole);
    }
  }

  // Default to requiring at least VIEWER role for unlisted routes
  return hasPermission(userRole, UserRole.VIEWER);
}
