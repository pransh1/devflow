import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";


export const users = pgTable('Users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', {length: 255}).notNull().unique(),
  username: varchar('username', {length: 50}).notNull().unique(),
  passwordHash: varchar('passwored_hashed', {length: 255}).notNull(),
  fullName: varchar('full_name', {length: 100}),
  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;