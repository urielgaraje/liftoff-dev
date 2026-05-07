import { createRequire } from "node:module";
import type PusherClient from "pusher-js";
import { EVENT, type ProgressUpdatedPayload } from "@/lib/realtime/events";
import { recordBroadcastLag, type Metrics } from "./metrics";
import { sentKey, type SentRegistry } from "./simulated-client";

const requireCjs = createRequire(import.meta.url);
const PusherCtor = requireCjs("pusher-js").Pusher as typeof PusherClient;

export type ProgressMonitor = {
  stop: () => Promise<void>;
};

export async function spawnProgressMonitor(args: {
  code: string;
  pusherKey: string;
  pusherCluster: string;
  metrics: Metrics;
  sentRegistry: SentRegistry;
}): Promise<ProgressMonitor> {
  const pusher = new PusherCtor(args.pusherKey, {
    cluster: args.pusherCluster,
    forceTLS: true,
  });
  const channelName = `room-${args.code}-progress`;
  const channel = pusher.subscribe(channelName);

  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("progress monitor subscribe timeout")),
      10_000,
    );
    channel.bind("pusher:subscription_succeeded", () => {
      clearTimeout(t);
      resolve();
    });
    channel.bind("pusher:subscription_error", (err: unknown) => {
      clearTimeout(t);
      reject(new Error(`progress monitor subscribe error: ${JSON.stringify(err)}`));
    });
  });

  channel.bind(EVENT.ProgressUpdated, (payload: ProgressUpdatedPayload) => {
    const sentAt = args.sentRegistry.get(sentKey(payload.playerId, payload.value));
    if (sentAt !== undefined) {
      recordBroadcastLag(args.metrics, Date.now() - sentAt);
      args.sentRegistry.delete(sentKey(payload.playerId, payload.value));
    }
  });

  return {
    stop: async () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    },
  };
}
