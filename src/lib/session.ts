import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "wishy_session";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET. Configura un secret llarg a l'entorn.");
  return "wishy-development-secret-change-before-deployment";
}
function signature(userId: string) {
  return createHmac("sha256", secret()).update(userId).digest("hex");
}

export async function createSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, `${userId}.${signature(userId)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const id = value.slice(0, separator);
  const supplied = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(signature(id));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  return prisma.user.findUnique({ where: { id } });
}
