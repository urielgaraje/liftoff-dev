import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "liftoff_host";
const COOKIE_MAX_AGE = 60 * 60 * 8;

function getSecret(): string {
  const s = process.env.HOST_COOKIE_SECRET;
  if (!s) throw new Error("HOST_COOKIE_SECRET is not set");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function buildHostCookieValue(roomId: string): string {
  return `${roomId}.${sign(roomId)}`;
}

export function verifyHostCookieValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const roomId = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(roomId);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
  } catch {
    return null;
  }
  return roomId;
}

export async function setHostCookie(roomId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, buildHostCookieValue(roomId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearHostCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getHostRoomId(): Promise<string | null> {
  const store = await cookies();
  return verifyHostCookieValue(store.get(COOKIE_NAME)?.value);
}

export function checkHostPassphrase(input: string): boolean {
  const expected = process.env.HOST_PASSPHRASE;
  if (!expected) throw new Error("HOST_PASSPHRASE is not set");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
