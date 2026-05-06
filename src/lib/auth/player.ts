import "server-only";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "liftoff_player_";
const COOKIE_MAX_AGE = 60 * 60 * 4;

export async function setPlayerCookie(code: string, playerId: string): Promise<void> {
  const store = await cookies();
  store.set(`${COOKIE_PREFIX}${code}`, playerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getPlayerId(code: string): Promise<string | null> {
  const store = await cookies();
  return store.get(`${COOKIE_PREFIX}${code}`)?.value ?? null;
}

export async function clearPlayerCookie(code: string): Promise<void> {
  const store = await cookies();
  store.delete(`${COOKIE_PREFIX}${code}`);
}
