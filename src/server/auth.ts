import "server-only";

import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "fevora_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

async function issueSession(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setSession(userId: string) {
  const token = await issueSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function authenticateOwner(email: string, password: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
    const ownerPassword = process.env.OWNER_PASSWORD;
    if (!ownerEmail || !ownerPassword || normalizedEmail !== ownerEmail || password !== ownerPassword) {
      return { error: "Початкове налаштування доступне лише власнику." };
    }

    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name?.trim() || null, passwordHash: await hash(password, 12) },
    });
    await setSession(user.id);
    return { user };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "Неправильний email або пароль." };
  }

  await setSession(user.id);
  return { user };
}
