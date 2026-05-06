import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roomStatus = pgEnum("room_status", ["lobby", "racing", "ended"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  status: roomStatus("status").notNull().default("lobby"),
  currentStageIndex: integer("current_stage_index").notNull().default(-1),
  stageStartedAt: timestamp("stage_started_at", { withTimezone: true }),
  stageInit: jsonb("stage_init"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  nickname: varchar("nickname", { length: 24 }).notNull(),
  rocketSkin: varchar("rocket_skin", { length: 16 }).notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    stageIndex: integer("stage_index").notNull(),
    value: integer("value").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    uniq: uniqueIndex("scores_player_stage_uniq").on(t.playerId, t.stageIndex),
  }),
);

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Score = typeof scores.$inferSelect;
