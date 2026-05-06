import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const roomStatus = pgEnum("room_status", ["lobby", "racing", "ended"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  status: roomStatus("status").notNull().default("lobby"),
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

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
