import "server-only";
import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  throw new Error("Missing Pusher server env vars");
}

export const pusherServer = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

export function roomChannel(code: string): string {
  return `room-${code}`;
}

export function roomProgressChannel(code: string): string {
  return `room-${code}-progress`;
}

export async function broadcast(
  code: string,
  event: string,
  payload: unknown,
): Promise<void> {
  await pusherServer.trigger(roomChannel(code), event, payload);
}

export async function broadcastProgress(
  code: string,
  event: string,
  payload: unknown,
): Promise<void> {
  await pusherServer.trigger(roomProgressChannel(code), event, payload);
}
