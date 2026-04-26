import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "admin" | "manager" | "seller";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

const COOKIE_NAME = "boutique_session";

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    "10fa7f5aaa3f752a83f8491230fc692e7341601a60f292f6dea95b909c89c9b6";

  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecretKey());

    return {
      id: Number(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role) as UserRole,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw new Error("Session utilisateur introuvable.");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireSession();

  if (!allowedRoles.includes(session.role)) {
    throw new Error("Accès refusé.");
  }

  return session;
}