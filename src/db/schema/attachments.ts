import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { issues } from './issues';
import { users } from './users';

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  issueId: uuid('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  uploadedById: uuid('uploaded_by_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  filename: varchar('filename', { length: 255 }).notNull(),   // original filename
  storedName: varchar('stored_name', { length: 255 }).notNull(), // uuid filename on disk
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),                             // bytes
  url: text('url').notNull(),                                  // public URL
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;