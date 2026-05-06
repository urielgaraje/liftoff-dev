"use client";
import PusherClient from "pusher-js";

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!key || !cluster) {
  throw new Error("Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER");
}

let instance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (instance) return instance;
  instance = new PusherClient(key!, {
    cluster: cluster!,
    forceTLS: true,
  });
  return instance;
}
